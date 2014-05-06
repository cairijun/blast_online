from gevent.wsgi import WSGIServer
import gevent.monkey
import webservice


if __name__ == '__main__':
    gevent.monkey.patch_all()
    server = WSGIServer(('', 5000), webservice.app)
    server.serve_forever()
