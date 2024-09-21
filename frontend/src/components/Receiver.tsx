import { useEffect } from "react"


export default function Receiver(){
    
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        }
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.controls = true;
        video.style.width = '100%';
        document.body.appendChild(video);

        const button = document.createElement('button');
        button.innerText = 'Play Video';
        button.onclick = () => {
            video.play().catch(error => {
                console.error('Autoplay failed:', error);
            });
        };
        document.body.appendChild(button);

        const pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
            console.log('track event', event)
            video.srcObject = new MediaStream([event.track]);
            video.play();
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }
    }

    return <div>
        
    </div>
}