import { Box } from '@mui/material';
import { useEffect, useState, useCallback, useRef } from 'react';
import PopupModal from '@components/PopupModal';
import { io, Socket } from 'socket.io-client';
import { useReview } from '@hooks/review.hook';
import { isBrowser } from 'react-device-detect';
import { RootState, useAppSelector } from '@stores/store';

import WaitingConnectionCardDesktop from './desktop/WaitingConnectionCard';
import ConnectingCardDesktop from './desktop/ConnectingCard';
import WaitingConnectionCardMobile from './mobile/WaitingConnectionCard';
import ConnectingCardMobile from './mobile/ConnectingCard';
import { useGetUserQuery } from '@apis/userApi';

const WaitingConnectionCard = isBrowser ? WaitingConnectionCardDesktop : WaitingConnectionCardMobile;
const ConnectingCard = isBrowser ? ConnectingCardDesktop : ConnectingCardMobile;

const VITE_SOCKET = import.meta.env.VITE_SOCKET;

const VideoChat = () => {
    const [selectedCountry, setSelectedCountry] = useState<string>('balanced');
    const [selectedGender, setSelectedGender] = useState<string>('both');
    const [startVideoChat, setStartVideoChat] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [strangerStream, setStrangerStream] = useState<MediaStream | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
    const [strangerUserId, setStrangerUserId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [userType, setUserType] = useState<'p1' | 'p2' | null>(null);
    const [messages, setMessages] = useState<IVideoChatMessage[]>([]);

    const { openReviewDialog } = useReview();

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const { user } = useAppSelector((state: RootState) => state.user);

    const { data: strangerInfo } = useGetUserQuery(strangerUserId ?? '', {
        skip: !strangerUserId,
    });

    const setupWebRTC = useCallback(async (socket: Socket, remoteId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnectionRef.current = pc;

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected') {
                socket.emit('video-chat:disconnect');
            }
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch((err) => {
            throw err;
        });
        setStream(mediaStream);
        mediaStream.getTracks().forEach((track) => pc.addTrack(track, mediaStream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('video-chat:ice:send', { candidate: event.candidate, to: remoteId });
            }
        };

        pc.ontrack = (event) => {
            setStrangerStream(event.streams[0]);
        };

        if (userType === 'p1') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('video-chat:sdp:send', { sdp: offer, to: remoteId });
        }
    }, [userType]);

    useEffect(() => {
        const newSocket = io(`${VITE_SOCKET}`, {
            path: '/v1/socket',
            query: { userId: user?.id },
        });

        socketRef.current = newSocket;

        newSocket.emit('video-chat:connect');

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('video-chat:disconnected', () => {
            console.log('Socket disconnected');
        });

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user]);

    // 2. Xử lý roomId
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('video-chat:send-room', (id: string) => {
                setRoomId(id);
            });
        }
    }, []);

    // 3. Xử lý video-chat:joined và thiết lập WebRTC
    useEffect(() => {
        if (socketRef.current) {
            const handleRemoteSocket = async ({ socketId, userId }: { socketId: string; userId: string }) => {
                if (!remoteSocketId) {
                    setRemoteSocketId(socketId);
                    setStrangerUserId(userId);

                    if (socketRef.current) {
                        setupWebRTC(socketRef.current, socketId);
                    }
                }
            };
            socketRef.current.on('video-chat:joined', handleRemoteSocket);

            return () => {
                socketRef.current?.off('video-chat:joined', handleRemoteSocket);
            };
        }
    }, [setupWebRTC, remoteSocketId]);

    // 4. Xử lý ICE candidate
    useEffect(() => {
        if (socketRef.current && remoteSocketId) {
            socketRef.current.on('video-chat:ice:reply', ({ candidate, from }) => {
                if (peerConnectionRef.current && from === remoteSocketId) {
                    peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
                        console.error('Error adding ICE candidate:', err)
                    );
                }
            });
        }
    }, [remoteSocketId]);

    // 5. Xử lý SDP
    useEffect(() => {
        if (socketRef.current && remoteSocketId) {
            socketRef.current.on('video-chat:sdp:reply', async ({ sdp, from }) => {
                if (peerConnectionRef.current && from === remoteSocketId) {
                    try {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                        if (sdp.type === 'offer') {
                            const answer = await peerConnectionRef.current.createAnswer();
                            await peerConnectionRef.current.setLocalDescription(answer);
                            socketRef.current?.emit('video-chat:sdp:send', { sdp: answer, to: remoteSocketId });
                        }
                    } catch (err) {
                        console.error('Error setting remote SDP:', err);
                    }
                }
            });
        }
    }, [remoteSocketId]);

    // 6. Xử lý tin nhắn từ server
    useEffect(() => {
        if (socketRef.current) {
            const handleMessage = (text: string, senderType: string) => {
                setMessages((prev) => [...prev, { text, sender: senderType === userType ? 'You' : 'Stranger' }]);
            };
            socketRef.current.on('video-chat:get-message', handleMessage);
            return () => {
                socketRef.current?.off('video-chat:get-message', handleMessage);
            };
        }
    }, [userType, roomId]);

    // 7. Xử lý ngắt kết nối
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('disconnected', () => {
                setStrangerStream(null);
                setRemoteSocketId(null);
                setStrangerUserId(null);
                setUserType(null);
                setRoomId(null);
                peerConnectionRef.current?.close();
            });
        }
    }, []);

    // 8. Xử lý lỗi từ server
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('video-chat:error', (msg: string) => {
                console.error('Server error:', msg);
            });
        }
    }, []);

    // 9. Xử lý sự kiện video-chat:end-chat (khi một người nhấn ESC)
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('video-chat:end-chat', () => {
                setStartVideoChat(false);
                setStrangerStream(null);
                setRemoteSocketId(null);
                setStrangerUserId(null);
                setUserType(null);
                setRoomId(null);
                setMessages([]);
                openReviewDialog();

                peerConnectionRef.current?.close();
                peerConnectionRef.current = null;
            });
        }
    }, [stream, openReviewDialog]);

    // 10. Xử lý sự kiện video-chat:next-chat (khi một người nhấn Next)
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('video-chat:next-chat', () => {
                setStrangerStream(null);
                setRemoteSocketId(null);
                setStrangerUserId(null);
                setUserType(null);
                setRoomId(null);
                setMessages([]);
                peerConnectionRef.current?.close();
                peerConnectionRef.current = null;

                socketRef.current?.emit('video-chat:start', { selectedGender, selectedCountry }, (type: 'p1' | 'p2') => {
                    setUserType(type);
                });
            });
        }
    }, [selectedGender, selectedCountry]);

    // 11. Xử lý sự kiện video-chat-online
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('video-chat-online', (count: number) => {
                console.log('Video chat online:', count);
            });
        }
    }, []);

    const handleStartVideoChat = useCallback(() => {
        setStartVideoChat(true);
        socketRef.current?.emit('video-chat:start', { selectedGender, selectedCountry }, (type: 'p1' | 'p2') => {
            setUserType(type);
        });
    }, [selectedGender, selectedCountry]);

    const startMedia = useCallback(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (peerConnectionRef.current) {
                    mediaStream.getTracks().forEach((track) => {
                        peerConnectionRef.current?.addTrack(track, mediaStream);
                    });
                }
            })
            .catch((error) => {
                console.error('Error accessing media devices:', error);
                setOpenModal(true);
            });
    }, []);

    useEffect(() => {
        const checkMediaPermissions = async () => {
            try {
                const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

                if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
                    setOpenModal(true);
                } else if (cameraPermission.state === 'granted' && microphonePermission.state === 'granted') {
                    startMedia();
                } else {
                    setOpenModal(true);
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                setOpenModal(true);
            }
        };

        checkMediaPermissions();
    }, [startMedia]);

    const handleCountrySelect = useCallback((country: string) => {
        setSelectedCountry(country);
    }, []);

    const handleGenderSelect = useCallback((gender: string) => {
        setSelectedGender(gender);
    }, []);

    const handleEndVideoChat = useCallback(() => {
        socketRef.current?.emit('video-chat:end-chat', roomId);
    }, [roomId]);

    const handleNextVideoChat = useCallback(() => {
        socketRef.current?.emit('video-chat:next-chat', roomId);
    }, [roomId]);

    const requestPermissions = useCallback(() => {
        setOpenModal(false);
        startMedia();
    }, [startMedia]);

    const sendMessage = useCallback((message: string) => {
        if (!socketRef.current) {
            return;
        }

        if (!roomId) {
            return;
        }

        if (!userType) {
            return;
        }

        if (!message.trim()) {
            return;
        }

        try {
            setMessages((prev) => [...prev, { text: message, sender: 'You' }]);
            socketRef.current.emit('video-chat:send-message', message, userType, roomId);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, [roomId, userType]);

    useEffect(() => {
        if (socketRef.current) {
            const handleError = (error: string) => {
                console.error('Socket error:', error);
            };
            socketRef.current.on('video-chat:error', handleError);

            return () => {
                socketRef.current?.off('video-chat:error', handleError);
            };
        }
    }, []);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                ...(isBrowser
                    ? { height: '90vh', paddingX: '10px', paddingY: '50px' }
                    : { padding: '10px' }),
            }}
        >
            {!startVideoChat && (
                <WaitingConnectionCard
                    handleCountrySelect={handleCountrySelect}
                    handleGenderSelect={handleGenderSelect}
                    handleStartVideoChat={handleStartVideoChat}
                    stream={stream}
                />
            )}
            {startVideoChat && (
                <ConnectingCard
                    handleEndVideoChat={handleEndVideoChat}
                    handleNextVideoChat={handleNextVideoChat}
                    stream={stream}
                    strangerStream={strangerStream}
                    messages={messages}
                    sendMessage={sendMessage}
                    strangerInfo={strangerInfo?.result}
                />
            )}
            <PopupModal
                title="Permission Required"
                message="Please allow camera and microphone permissions to start video chat."
                open={openModal}
                onClose={() => setOpenModal(false)}
                onConfirm={requestPermissions}
                stage="permission"
            />
        </Box>
    );
};

export default VideoChat;