import os
import sys

path = os.path.expanduser('~/cavaliver-app')
if path not in sys.path:
    sys.path.append(path)

from app import app as application
