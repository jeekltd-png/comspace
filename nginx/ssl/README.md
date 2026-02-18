# Nginx SSL Certificates
# ======================
# Place your SSL certificate files here:
#
# - fullchain.pem  (certificate + intermediate chain)
# - privkey.pem    (private key)
#
# For local development/testing, generate self-signed certificates:
#   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout privkey.pem -out fullchain.pem \
#     -subj "/CN=comspace.example.com"
#
# For production, use Let's Encrypt / certbot:
#   certbot certonly --standalone -d comspace.example.com -d api.comspace.example.com
#
# NEVER commit real certificates to version control!
*.pem
*.key
*.crt
