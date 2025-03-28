#!/bin/bash

echo "Du00e9marrage de l'application en mode debug"

# Initialiser la base de donnu00e9es
python init_render_db.py

# Du00e9marrer l'application avec Gunicorn (en mode debug)
gunicorn app:app --log-level debug
