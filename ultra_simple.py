from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Application de Du00e9mu00e9nagement - Version Simple</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f2f5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #1877f2;
                color: white;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                margin: -20px -20px 20px -20px;
                text-align: center;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                background-color: #1877f2;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
            }
            button:hover {
                background-color: #166fe5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Du00e9mu00e9nagement App</h1>
            </div>
            <h2>Connexion</h2>
            <form method="post" action="/login">
                <div class="form-group">
                    <label for="username">Nom d'utilisateur:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Mot de passe:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit">Se connecter</button>
            </form>
            <p style="margin-top: 20px; text-align: center;">
                Version ultra-simplifiu00e9e pour du00e9monstration
            </p>
        </div>
    </body>
    </html>
    '''

@app.route('/login', methods=['POST'])
def login():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Application de Du00e9mu00e9nagement - Tableau de bord</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f2f5;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #1877f2;
                color: white;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                margin: -20px -20px 20px -20px;
                text-align: center;
            }
            .dashboard-item {
                background-color: #e9f5ff;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            .dashboard-item h3 {
                margin-top: 0;
                color: #1877f2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Du00e9mu00e9nagement App - Tableau de bord</h1>
            </div>
            <div class="dashboard-item">
                <h3>Bienvenue!</h3>
                <p>Vous u00eates connectu00e9 u00e0 la version ultra-simplifiu00e9e de l'application.</p>
            </div>
            <div class="dashboard-item">
                <h3>Clients</h3>
                <p>0 clients enregistru00e9s</p>
            </div>
            <div class="dashboard-item">
                <h3>Prestations</h3>
                <p>0 prestations enregistru00e9es</p>
            </div>
            <p style="margin-top: 20px; text-align: center;">
                Version ultra-simplifiu00e9e pour du00e9monstration
            </p>
        </div>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(debug=True)
