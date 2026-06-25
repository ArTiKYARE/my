import os
import subprocess
import sys
from pathlib import Path

import paramiko

# --- Конфигурация ---
REMOTE_HOST = os.getenv("KOSKO_HOST", "").strip()
REMOTE_USER = os.getenv("KOSKO_USER", "root").strip()
REMOTE_PASSWORD = os.getenv("KOSKO_PASSWORD", "").strip()
REMOTE_BASE = os.getenv("KOSKO_REMOTE_BASE", "/opt/kos-ko").strip()
REMOTE_CADDYFILE_PATH = os.getenv(
    "KOSKO_CADDYFILE_PATH", "/opt/caddy/Caddyfile"
).strip()
REMOTE_RELOAD_CMD = os.getenv(
    "KOSKO_RELOAD_CMD",
    "docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile",
).strip()
IMAGE_NAME = os.getenv("KOSKO_IMAGE_NAME", "kos-ko:latest").strip()
CONTAINER_NAME = os.getenv("KOSKO_CONTAINER_NAME", "kos-ko").strip()
REPO_URL = os.getenv("KOSKO_REPO_URL", "").strip()


def run(cmd: list[str] | str, check: bool = True, cwd: Path | None = None) -> subprocess.CompletedProcess:
    """Запуск shell-команды с выводом в реальном времени."""
    if isinstance(cmd, list):
        cmd_str = " ".join(cmd)
    else:
        cmd_str = cmd
    print(f">>> {cmd_str}")
    return subprocess.run(cmd_str, shell=True, check=check, cwd=cwd)


def get_repo_url() -> str:
    """Получает URL удалённого репозитория origin."""
    if REPO_URL:
        return REPO_URL
    result = subprocess.run(
        "git remote get-url origin",
        shell=True,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("ERROR: Could not determine git remote URL.")
        print("Set KOSKO_REPO_URL or configure origin remote.")
        sys.exit(1)
    return result.stdout.strip()


def git_push() -> None:
    """Коммитит и пушит изменения в текущую ветку."""
    print("\n=== GIT PUSH ===")
    run(["git", "add", "."])

    has_commits = subprocess.run(
        "git rev-parse HEAD", shell=True, capture_output=True
    ).returncode == 0

    if not has_commits:
        run(['git', 'commit', '-m', '"Initial commit"'])
    else:
        try:
            run(['git', 'commit', '-m', '"deploy: update kos-ko site"'])
        except subprocess.CalledProcessError:
            print("No changes to commit or commit failed, continuing...")

    run(["git", "push", "origin", "main"])


def ensure_remote_dir(sftp_client, remote_dir: str) -> None:
    """Рекурсивно создаёт удалённые директории (mkdir -p через SFTP)."""
    dirs = []
    current = remote_dir
    while current and current != "/":
        try:
            sftp_client.stat(current)
            break
        except IOError:
            dirs.append(current)
            current = os.path.dirname(current)
    for d in reversed(dirs):
        sftp_client.mkdir(d)


def deploy_ssh() -> None:
    """Деплоит приложение на сервер с сборкой внутри контейнера/среды сервера."""
    print("\n=== SSH DEPLOY ===")
    if not REMOTE_HOST or not REMOTE_PASSWORD:
        print(
            "\nERROR: SSH credentials not configured.\n"
            "Set environment variables before running deploy.py:\n"
            "  $env:KOSKO_HOST = '158.255.4.142'\n"
            "  $env:KOSKO_USER = 'root'\n"
            "  $env:KOSKO_PASSWORD = 'your_password'\n"
            "  $env:KOSKO_REMOTE_BASE = '/opt/kos-ko'  # optional\n"
        )
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(REMOTE_HOST, username=REMOTE_USER, password=REMOTE_PASSWORD)

    sftp = client.open_sftp()
    try:
        ensure_remote_dir(sftp, REMOTE_BASE)

        # Загружаем Caddyfile
        print(f"Uploading Caddyfile to {REMOTE_CADDYFILE_PATH} ...")
        ensure_remote_dir(sftp, os.path.dirname(REMOTE_CADDYFILE_PATH))
        sftp.put("Caddyfile", REMOTE_CADDYFILE_PATH)
    finally:
        sftp.close()

    repo_url = get_repo_url()

    # Команды на сервере: клонирование/обновление репозитория, сборка и запуск
    commands = [
        # Проверяем/клонируем репозиторий
        f"if [ ! -d {REMOTE_BASE}/.git ]; then rm -rf {REMOTE_BASE} && git clone {repo_url} {REMOTE_BASE}; fi",
        f"cd {REMOTE_BASE} && git pull origin main",
        # Загружаем .env, если он есть локально (будет передан отдельно)
        f"cd {REMOTE_BASE} && npm install",
        f"cd {REMOTE_BASE} && npm run build",
        f"cd {REMOTE_BASE} && docker build -t {IMAGE_NAME} .",
        f"cd {REMOTE_BASE} && docker compose up -d --force-recreate",
        REMOTE_RELOAD_CMD,
    ]

    full_output = []
    exit_code = 0
    for cmd in commands:
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        full_output.append(f"=== CMD ===\n{cmd}\n=== EXIT ===\n{code}\n=== STDOUT ===\n{out}\n=== STDERR ===\n{err}")
        if code != 0:
            exit_code = code
            print(out[-2000:])
            print(err[-2000:])
            break

    # Загружаем .env в самом конце, чтобы перезаписать возможный старый файл
    env_source = ".env" if os.path.exists(".env") else ".env.local"
    if os.path.exists(env_source):
        sftp = client.open_sftp()
        try:
            print(f"\nUploading {env_source} to {REMOTE_BASE}/.env ...")
            sftp.put(env_source, f"{REMOTE_BASE}/.env")
        finally:
            sftp.close()
        # Перезапускаем контейнер, чтобы подхватить новый .env
        restart_cmd = f"cd {REMOTE_BASE} && docker compose up -d --force-recreate"
        print(f">>> {restart_cmd}")
        stdin, stdout, stderr = client.exec_command(restart_cmd)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        full_output.append(f"=== CMD ===\n{restart_cmd}\n=== EXIT ===\n{code}\n=== STDOUT ===\n{out}\n=== STDERR ===\n{err}")
        if code != 0:
            exit_code = code
            print(out[-2000:])
            print(err[-2000:])

    client.close()

    with open("deploy_output.txt", "w", encoding="utf-8") as f:
        f.write("\n\n".join(full_output))

    if exit_code != 0:
        print(f"\nDeploy failed with exit code {exit_code}")
        sys.exit(exit_code)

    print(f"\nDeployed successfully to {REMOTE_HOST}")


def main() -> None:
    git_push()

    if REMOTE_HOST and REMOTE_PASSWORD:
        deploy_ssh()
    else:
        print("\nSSH credentials not set, skipping server deploy.")


if __name__ == "__main__":
    main()
