FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    gtkwave xvfb x11vnc fluxbox supervisor novnc git wget curl \
    && apt-get clean

# Set up noVNC
WORKDIR /opt/novnc
RUN git clone https://github.com/novnc/noVNC.git . && \
    git clone https://github.com/novnc/websockify.git utils/websockify

# PATCH: Remove iframe-blocking headers
RUN sed -i '/X-Frame-Options/d' utils/websockify/websockify/websocket.py && \
    sed -i '/Content-Security-Policy/d' utils/websockify/websockify/websocket.py

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Watch-trigger script
COPY watch_trigger.py /app/watch_trigger.py

EXPOSE 6080
CMD ["/usr/bin/supervisord"]
