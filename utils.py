from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime
import os
import tempfile

def generate_mission_pdf(prestation):
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        doc = SimpleDocTemplate(tmp.name, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # En-tête
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30
        )
        story.append(Paragraph("Ordre de Mission", title_style))
        story.append(Spacer(1, 12))

        # Informations de la prestation
        data = [
            ['Date de début:', prestation.date_debut.strftime('%d/%m/%Y %H:%M')],
            ['Date de fin:', prestation.date_fin.strftime('%d/%m/%Y %H:%M')],
            ['Client:', f"{prestation.client.nom} {prestation.client.prenom}"]
        ]
        
        # Ajout des champs avec gestion des attributs potentiellement manquants
        try:
            data.append(['Adresse de départ:', prestation.trajet_depart if hasattr(prestation, 'trajet_depart') else prestation.adresse_depart])
        except:
            data.append(['Adresse de départ:', prestation.adresse_depart])
            
        try:
            data.append(['Adresse de destination:', prestation.trajet_destination if hasattr(prestation, 'trajet_destination') else prestation.adresse_arrivee])
        except:
            data.append(['Adresse de destination:', prestation.adresse_arrivee])
        
        data.extend([
            ['Société:', prestation.societe or ''],
            ['Montant:', f"{prestation.montant}€" if prestation.montant else ''],
            ['Observations:', prestation.observation or '']
        ])

        table = Table(data, colWidths=[150, 350])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))

        story.append(table)
        doc.build(story)
        return tmp.name

def generate_client_pdf(client):
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        doc = SimpleDocTemplate(tmp.name, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # En-tête
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30
        )
        story.append(Paragraph("Fiche Client", title_style))
        story.append(Spacer(1, 12))

        # Informations client
        data = [
            ['Nom:', client.nom],
            ['Prénom:', client.prenom],
            ['Adresse:', client.adresse or ''],
            ['Téléphone:', client.telephone or ''],
            ['Email:', client.email or '']
        ]

        table = Table(data, colWidths=[150, 350])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))

        story.append(table)
        story.append(Spacer(1, 20))

        # Historique des prestations
        story.append(Paragraph("Historique des prestations", styles['Heading2']))
        story.append(Spacer(1, 12))

        prestations = getattr(client, 'prestations', [])
        if prestations:
            prestations_data = [['Date', 'Départ', 'Destination', 'Statut']]
            for p in prestations:
                prestations_data.append([
                    p.date_debut.strftime('%d/%m/%Y'),
                    p.trajet_depart,
                    p.trajet_destination,
                    p.statut
                ])

            table = Table(prestations_data, colWidths=[100, 150, 150, 100])
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey)
            ]))
            story.append(table)

        doc.build(story)
        return tmp.name

def format_date_for_input(date):
    """Format a date for an input datetime-local field"""
    if date:
        return date.strftime('%Y-%m-%dT%H:%M')
