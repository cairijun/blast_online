from flask import (render_template, request, jsonify, safe_join,
                   send_from_directory)
from werkzeug.exceptions import NotFound
import time
import uuid
import redis
import os.path

import config
from worker import blast
from . import app


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/query', methods=['POST'])
@app.route('/query/upload', methods=['POST'])
def query():
    if request.form['program'] not in config.BLAST_DEFAULT_KWARGS:
        return jsonify(errno=-1, err_msg='Unsupported program')

    task_id = uuid.uuid1().get_hex()
    if request.path == '/query':
        with open(os.path.join(config.BLAST_INPUT_DIR, task_id), 'w')\
                as fobj:
            fobj.write(request.form['input'])
    else:
        request.files['input'].save(os.path.join(config.BLAST_INPUT_DIR,
                                                 task_id))

    blast.run.delay(task_id, request.form['program'],
                    {'-query': os.path.join(config.BLAST_INPUT_DIR, task_id),
                     '-out': os.path.join(config.BLAST_OUTPUT_DIR, task_id),
                     '-evalue': request.form['evalue'],
                     '-outfmt': request.form['outfmt'],
                     '-db': os.path.join(config.BLAST_DB_DIR,
                                         request.form['database'])})

    r = redis.Redis()
    r.setnx('task_status:' + task_id, 'queuing')

    return jsonify(errno=0, err_msg='Success', task_id=task_id)


@app.route('/status/<task_id>')
def status(task_id):
    r = redis.Redis()
    s = r.get('task_status:' + task_id)
    if s is None:
        s = 'nonexistent'

    return jsonify(errno=0, err_msg='Success', status=s,
                   msg=r.get('task_err_msg:' + task_id))


@app.route('/status/<task_id>/poll')
def status_poll(task_id):
    r = redis.Redis()

    status_key = 'task_status:' + task_id
    prev_status = r.get(status_key)
    for i in range(config.POLL_STATUS_RETRIES):
        s = r.get(status_key)
        if s is None or s in ('finished', 'failed') or s != prev_status:
            break
        time.sleep(0.2)

    return jsonify(errno=0, err_msg='Success', status=s,
                   msg=r.get('task_err_msg:' + task_id))


@app.route('/result/<task_id>')
def result(task_id):
    try:
        filename = safe_join(config.BLAST_OUTPUT_DIR, task_id)
        with open(filename) as fobj:
            result = fobj.read()
    except (NotFound, IOError):
        return jsonify(errno=-2, err_msg='Result not found')
    return jsonify(errno=0, err_msg='Success', result=result)


@app.route('/result/download/<task_id>')
def result_download(task_id):
    return send_from_directory(os.path.abspath(config.BLAST_OUTPUT_DIR),
                               task_id)
