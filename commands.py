import click
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash
from models import db, User

@click.command('create-superadmin')
@click.argument('username')
@click.argument('password')
@with_appcontext
def create_superadmin(username, password):
    """Créer un compte super administrateur."""
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        click.echo('Un utilisateur avec ce nom existe déjà.')
        return

    user = User(
        username=username,
        password=generate_password_hash(password),
        role='superadmin',
        nom='Super',
        prenom='Admin'
    )
    db.session.add(user)
    db.session.commit()
    click.echo(f'Super administrateur {username} créé avec succès.')
