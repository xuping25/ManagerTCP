#!/bin/bash

#jar包名称
JAR_NAME=ManagerEdgeBackend-1.0-SNAPSHOT.jar
#获取进程id
PID=$(jps -l | grep $JAR_NAME | awk '{print $1}')
#杀死进程
kill -9 $PID
#执行启动脚本或命令
sh /opt/manager/ManagerEdge.sh &
echo "启动ManagerEdge.jar成功"
