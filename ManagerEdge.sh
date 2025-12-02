#!/bin/sh
nohup java -Dlogging.config=logback.xml -jar ManagerEdgeBackend-1.0-SNAPSHOT.jar    --spring.config.name=run