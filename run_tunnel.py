import subprocess
import time
import os
import re

exe_path = r'C:\Users\User\.gemini\antigravity\scratch\telegram-sheets-bot\cloudflared.exe'

print("Waiting for cloudflared.exe download...")
while True:
    if os.path.exists(exe_path) and os.path.getsize(exe_path) > 15 * 1024 * 1024:
        break
    time.sleep(2)

print("cloudflared.exe ready! Starting Cloudflare Tunnel...")
cmd = [exe_path, "tunnel", "--url", "http://localhost:5000"]
proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')

url = None
for line in proc.stdout:
    print(line, end='')
    match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
    if match:
        url = match.group(0)
        print(f"\n[SUCCESS] Cloudflare Tunnel URL: {url}\n")
        break

if url:
    # Update .env
    env_path = r'C:\Users\User\.gemini\antigravity\scratch\telegram-sheets-bot\.env'
    with open(env_path, 'r', encoding='utf-8') as f:
        env_content = f.read()
    
    if 'WEBAPP_URL=' in env_content:
        env_content = re.sub(r'WEBAPP_URL=.*', f'WEBAPP_URL={url}', env_content)
    else:
        env_content += f'\nWEBAPP_URL={url}\n'
        
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(env_content)
    print(f"[OK] .env updated with WEBAPP_URL={url}")
    
    # Restart bot
    print("[BOT] Starting bot.py with new WEBAPP_URL...")
    subprocess.Popen(["python", "bot.py"], cwd=r'C:\Users\User\.gemini\antigravity\scratch\telegram-sheets-bot')

# Keep process alive
proc.wait()
