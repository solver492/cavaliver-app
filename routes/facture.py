
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from models import Facture, Prestation
from extensions import db
from utils_modules.notifications import is_authorized

facture_bp = Blueprint('facture', __name__)

from forms import FactureSearchForm

@facture_bp.route('/')
@login_required
def index():
    form = FactureSearchForm()
    factures = Facture.query.all()
    return render_template('factures/index.html', factures=factures, form=form, title='Gestion des factures')

@facture_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add():
    return render_template('factures/add.html', title='Ajouter une facture')

@facture_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit(id):
    facture = Facture.query.get_or_404(id)
    return render_template('factures/edit.html', facture=facture, title='Modifier une facture')

@facture_bp.route('/view/<int:id>')
@login_required
def view(id):
    facture = Facture.query.get_or_404(id)
    return render_template('factures/view.html', facture=facture, title='Détails de la facture')
