# Deployment and Security Strategy Justification

This document provides a justification for our chosen deployment alternatives and outlines the steps taken to secure our production servers. It is intended to fulfill the project submission principles.

## 1. Using Alternatives to PaaS (Vercel/Railway) and Managing Security

### The Choice: Self-Managed VPS (Virtual Private Server)

While Platform-as-a-Service (PaaS) providers like Vercel and Railway offer excellent developer experience and rapid deployment, we opted to use a **Self-Managed VPS** (e.g., DigitalOcean Droplet, Linode, AWS EC2, or Hetzner) for our production environment. 

### Justification

1. **Granular Network Control**: PaaS providers abstract the underlying network, meaning we cannot apply low-level firewall rules or control inter-service communication securely at the packet level. With a VPS, we can use UFW (Uncomplicated Firewall) to block all ports except exactly what is required (e.g., 80/443 for web traffic, 22 for SSH).
2. **Database Isolation**: We are running custom databases (like FalkorDB or a self-hosted database instance). Deploying databases on shared or dynamically provisioned PaaS networks introduces risk. On a VPS, we can ensure the database is strictly bound to `localhost` (`127.0.0.1`) or within a secure Docker network bridge, making it entirely inaccessible from the public internet.
3. **Cost Predictability and Scaling**: PaaS solutions often have opaque egress costs and aggressive pricing cliffs. A VPS gives us predictable hardware boundaries, making DDoS attacks less financially devastating.
4. **Environment Sovereignty**: By managing the OS ourselves, we can install custom security modules (like `fail2ban`), configure hardened SSH keys, and implement strict user permission models that are impossible on purely serverless platforms.

---

## 2. Securing the Servers

Security is paramount. On our VPS, we have implemented several robust security measures at the infrastructure level. 

> **Important note for submission**: You need to replace the placeholders below with actual screenshots from your server/dashboard to prove these configurations are active.

### A. Firewall Configuration (UFW)
We enforce a strict default-deny policy. Only essential traffic is permitted.
- `sudo ufw default deny incoming`
- `sudo ufw default allow outgoing`
- `sudo ufw allow 22/tcp` (SSH)
- `sudo ufw allow 80/tcp` (HTTP)
- `sudo ufw allow 443/tcp` (HTTPS)

*(Insert Screenshot here showing the output of `sudo ufw status verbose`)*

### B. SSH Hardening
We disabled password authentication to prevent brute-force attacks. Access is strictly limited to authorized Ed25519 SSH keys.
- **Root login disabled:** `PermitRootLogin no` in `/etc/ssh/sshd_config`
- **Password auth disabled:** `PasswordAuthentication no` in `/etc/ssh/sshd_config`

*(Insert Screenshot here showing your terminal successfully logging in via SSH key, or the config file snippet)*

### C. Fail2Ban Integration
To defend against automated attacks and dictionary sweeps, we installed `fail2ban`. It actively monitors SSH auth logs and automatically bans IP addresses that show malicious signs (e.g., multiple failed login attempts).

*(Insert Screenshot here showing the output of `sudo fail2ban-client status sshd` displaying the list of banned IPs)*

### D. Reverse Proxy with SSL (Nginx / Cloudflare)
We do not expose our backend application (FastAPI) directly on port 8000 to the internet. Instead:
- FastAPI runs securely on `localhost:8000`.
- Nginx acts as a reverse proxy on ports 80/443, handling SSL termination (via Let's Encrypt / Certbot).
- For further DDOS mitigation, DNS is routed through Cloudflare's proxy (the "Orange Cloud").

*(Insert Screenshot here showing the Cloudflare DNS dashboard with Proxy Status enabled, or the Nginx config file)*

---
**Summary**: By utilizing a VPS and applying industry-standard hardening techniques, our infrastructure is significantly more resilient to both automated attacks and targeted exploits compared to a default PaaS deployment.
