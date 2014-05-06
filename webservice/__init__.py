from flask import Flask 


app = Flask('webservice')

from . import views
