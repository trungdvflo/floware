#!/bin/bash
# How it works:
# 1. chmod +x runAllWorker.sh
# 2. ./runAllWorker.sh
# Note: remove this line in on worker: app.listen()

# Define the list of workers and their corresponding ports
workers=(
  "worker-api-last-modify,6666"
  "worker-links-object,7777"
  "worker-manual-rules,5555"
  "worker-collection,3456"
  "worker-kanban,2434"
  "worker-common,6565"
  "worker-object,6566"
  "worker-third-party-account,6656"
  "worker-trash-collection,5656"
  "worker-delete-caldav,3464"
  "worker-delete-child-collection,4564"
  "cronjob:invalid-data,4533"
  "worker:invalid-data-deletion,4533"
  "worker:invalid-flomail-collector,3439"
  "worker:invalid-flo-object-collector,3403"
)
enableRabbit=true
# Loop through each worker and open a new terminal window to start them
for worker in "${workers[@]}"
do
  # Extract the worker name and port
  name=$(echo "$worker" | cut -d',' -f1)
  port=$(echo "$worker" | cut -d',' -f2)

  

  # Set the PORTW environment variable and construct the command
  command="cd `pwd` && export RABBIT_MQ_ENABLE=$enableRabbit \
            && export PORTW=$port \
            && npm run $name"

  # Set the terminal window title
  title="Worker: $worker"
  title_command="echo -ne \"\\033$title\\007\""

  # Execute the AppleScript to open a new Terminal window, set the title, and run the command
  # osascript -e "tell application \"Terminal\" to do script \"$title_command\""
  # MacOS
  osascript -e "tell application \"Terminal\" to do script \"$command\""
  # Linux
  # gnome-terminal -- /bin/bash -c "$command; exec /bin/bash"

done
