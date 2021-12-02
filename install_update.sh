#!/bin/bash

SCRIPT_NAME=install_update.sh
SERVICE_FILE=rossch.service

OLD_SHA1=$(sha1sum "$PWD"/$SCRIPT_NAME) || {
    echo "Failed to calculate sha1"
    exit 1
}

echo "Checking for updates..."

# Fetch latest master branch
git fetch origin master || {
    echo "Failed to fetch master branch from origin"
    exit 1
}

# Reset the service file which changes dynamically
git checkout master -- rossch.service || {
    echo "Failed to reset rossch.service"
    exit 1
}
# Rebase changed onto any updates
git rebase origin/master || {
    echo "Failed to rebase ontop of changes from origin/master"
    exit 1
}

# Check if the update script changed and prompt restart if it did
NEW_SHA1=$(sha1sum "$PWD"/$SCRIPT_NAME) || {
    echo "Failed to calculate sha1"
    exit 1
}

if [[ ${OLD_SHA1} != "${NEW_SHA1}" ]]; then
    echo "$SCRIPT_NAME changed, run this again."
    chmod +x "$PWD"/$SCRIPT_NAME || {
        echo "Failed to mark script as executable"
        exit 1
    }
    exit 0
fi

echo "Stopping existing service file"
sudo systemctl stop $SERVICE_FILE
sudo systemctl disable $SERVICE_FILE

# Set the path within the systemd unit service
echo "Modifying service file"
sed -i "s#<GIT_PATH>#$PWD#g" $SERVICE_FILE || {
    echo "Failed to update path in service file"
    exit 1
}

# Set the user and group in the unit service
sed -i "s#<USER>#$USER#g" $SERVICE_FILE || {
    echo "Failed to update user in service file"
    exit 1
}

sed -i "s#<GROUP>#$USER#g" $SERVICE_FILE || {
    echo "Failed to update group in service file"
    exit 1
}

# Symlink the service file and enable it
echo "Symlinking service file"
sudo ln -sfn "$PWD"/$SERVICE_FILE /etc/systemd/system/$SERVICE_FILE || {
    echo "Failed to symlink systemd service file"
    exit 1
}

echo "Reloading systemd daemon"
sudo systemctl daemon-reload || {
    echo "Failed to reload systemd daemon"
    exit 1
}

echo "Enabling service file"
sudo systemctl enable $SERVICE_FILE || {
    echo "Failed to enable systemd service file"
    exit 1
}

echo "Starting systemd service"
sudo systemctl start $SERVICE_FILE || {
    echo "Failed to start systemd service file"
    exit 1
}

echo "Done! Use 'journalctl -xfu rossch.service' to monitor"
