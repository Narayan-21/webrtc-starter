import { useEffect, useRef, useState } from "react"

export default function Receiver() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [videoStatus, setVideoStatus] = useState<string>("Waiting for video stream...");

    useEffect(() => {
        let ws: WebSocket;

        const connectWebSocket = () => {
            ws = new WebSocket('ws://localhost:8080');

            ws.onopen = () => {
                console.log("WebSocket connected");
                setSocket(ws);
                setIsConnected(true);
                setError(null);
                ws.send(JSON.stringify({ type: 'receiver' }));
            };

            ws.onerror = (event) => {
                console.error("WebSocket error:", event);
                setError("Failed to connect to WebSocket server. Please check if the server is running.");
            };

            ws.onclose = (event) => {
                console.log("WebSocket closed:", event);
                setIsConnected(false);
                setError("WebSocket connection closed. Attempting to reconnect...");
                setTimeout(connectWebSocket, 5000);
            };
        };

        connectWebSocket();

        const newPC = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        setPC(newPC);

        newPC.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", newPC.iceConnectionState);
        };

        newPC.onconnectionstatechange = () => {
            console.log("Connection state:", newPC.connectionState);
        };

        newPC.ontrack = (event) => {
            console.log('Track received:', event);
            console.log('Track kind:', event.track.kind);
            console.log('Track readyState:', event.track.readyState);
            
            if (event.streams && event.streams[0]) {
                console.log('Stream received:', event.streams[0]);
                console.log('Stream ID:', event.streams[0].id);
                console.log('Stream active:', event.streams[0].active);
                console.log('Stream tracks:', event.streams[0].getTracks());

                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                    setVideoStatus("Video stream received. Playing...");
                } else {
                    setVideoStatus("Video element not found. This shouldn't happen.");
                }
            } else {
                console.log('No stream found in the track event');
                if (event.track.kind === 'video') {
                    const newStream = new MediaStream([event.track]);
                    if (videoRef.current) {
                        videoRef.current.srcObject = newStream;
                        setVideoStatus("Created new MediaStream from received track. Playing...");
                    }
                } else {
                    setVideoStatus("Received track is not video. Kind: " + event.track.kind);
                }
            }
        };

        return () => {
            if (ws) ws.close();
            if (newPC) newPC.close();
        };
    }, []);

    useEffect(() => {
        if (!socket || !pc) return;

        socket.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("Received message:", message);
                if (message.type === 'createOffer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                    console.log("Remote description set");
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log("Local description set");
                    socket.send(JSON.stringify({
                        type: 'createAnswer',
                        sdp: answer
                    }));
                    console.log("Answer sent");
                } else if (message.type === 'iceCandidate' && message.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                    console.log("ICE candidate added");
                }
            } catch (err: any) {
                console.error("Error processing message:", err);
                setError(`Error processing message: ${err.message}`);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
                console.log("ICE candidate sent");
            }
        };
    }, [socket, pc]);

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <div style={{ color: isConnected ? 'green' : 'orange' }}>
                {isConnected ? 'Connected to WebSocket server' : 'Attempting to connect...'}
            </div>
            <div>{videoStatus}</div>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                controls 
                style={{ width: '100%', maxWidth: '640px', marginTop: '10px' }}
                onLoadedMetadata={() => console.log("Video metadata loaded")}
                onPlay={() => console.log("Video started playing")}
            ></video>
        </div>
    )
}