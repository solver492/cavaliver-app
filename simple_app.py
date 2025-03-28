from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def hello():
    return "<h1>L'application de déménagement fonctionne!</h1><p>Cette version simplifiée démontre que le déploiement est possible.</p>"

if __name__ == '__main__':
    app.run(debug=True, port=8000)
