# Configuração do Google Calendar

## Passos para configurar a integração com Google Calendar:

### 1. Criar Service Account no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie ou selecione um projeto
3. Vá para **IAM & Admin → Service Accounts**
4. Clique em **Create Service Account**
5. Preencha os dados e crie

### 2. Gerar Credenciais JSON

1. Na lista de Service Accounts, clique nos 3 pontos da conta criada
2. Selecione **Manage keys**
3. Clique em **Add Key → Create new key**
4. Escolha o formato **JSON**
5. Faça o download do arquivo

### 3. Configurar no Projeto

1. Renomeie o arquivo baixado para: `agendaconsult-481122-c9b54cd92f0b.json`
2. Coloque o arquivo em: `/app/backend/`
3. O arquivo já está no `.gitignore` e não será commitado

### 4. Dar Permissões ao Service Account

1. Copie o email do Service Account (ex: `xxx@xxx.iam.gserviceaccount.com`)
2. Acesse o [Google Calendar](https://calendar.google.com/)
3. Vá em **Configurações** do calendário que deseja usar
4. Em **Compartilhar com pessoas específicas**, adicione o email do Service Account
5. Dê permissão de **"Fazer alterações nos eventos"**

### 5. Atualizar CALENDAR_ID no Código

No arquivo `/app/backend/google_calendar.py`, linha 12:
```python
CALENDAR_ID = 'seucalendario@gmail.com'  # Trocar pelo email do seu calendário
```

## Estrutura do arquivo de credenciais

Use o template `google-calendar-credentials.template.json` como referência.

## Verificação

Após configurar, reinicie o backend:
```bash
sudo supervisorctl restart backend
```

E teste a integração fazendo uma reserva na aplicação.
