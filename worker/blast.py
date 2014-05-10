import redis
import subprocess as sp

import config
from . import app


class _BlastTaskBase(app.Task):
    abstract = True
    ignore_result = True
    _r = None

    def _report_started(self):
        self._r = self._r or redis.Redis()
        self._r.set('task_status:{}'.format(self.task_id), 'working')

    def on_success(self, *args, **kwargs):
        self._r = self._r or redis.Redis()
        self._r.set('task_status:{}'.format(self.task_id), 'finished')

    def on_failure(self, exc, *args, **kwargs):
        self._r = self._r or redis.Redis()
        self._r.set('task_status:{}'.format(self.task_id), 'failed')
        self._r.set('task_err_msg:{}'.format(self.task_id), str(exc))


class _BlastRunError(Exception):
    def __init__(self, sp_exc):
        self.sp_exc = sp_exc

    def __str__(self):
        return ('Blast program return code: %d\ncmd: %s\nmsg:\n%s' %
                (self.sp_exc.returncode,
                 ''.join(self.sp_exc.cmd),
                 self.sp_exc.output))


class _BlastProgram(object):
    default_kwargs = config.BLAST_DEFAULT_KWARGS

    def __init__(self, program):
        if program not in self.default_kwargs:
            raise KeyError('Unsupported program %s' % program)
        self.program = program

    def __call__(self, args, kwargs):
        self.kwargs = self.default_kwargs[self.program].copy()
        self.kwargs.update(kwargs)

        args = list(args)
        args.insert(0, self.program)
        for k in self.kwargs:
            args.append(k)
            args.append(self.kwargs[k])

        sp.check_output(args, stderr=sp.STDOUT)


@app.task(bind=True, base=_BlastTaskBase)
def run(self, task_id, program, kwargs, args=None):
    self.task_id = task_id
    self._report_started()
    try:
        _BlastProgram(program)(args or [], kwargs)
    except sp.CalledProcessError as e:
        raise _BlastRunError(e)
