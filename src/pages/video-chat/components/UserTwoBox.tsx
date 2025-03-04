import { Box, Typography } from '@mui/material';
import React from 'react';
import { images } from '../../../assets';

interface UserTwoBoxProps {
    strangerVideoRef: React.RefObject<HTMLVideoElement>;
}

const UserTwoBox = ({ strangerVideoRef }: UserTwoBoxProps) => {
    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'relative',
        }}>
            {strangerVideoRef.current ? (
                <video
                    ref={strangerVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '10px',
                    }}
                />
            ) : (
                <>
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        borderRadius: '10px',
                        gap: '10px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {[images.vid1, images.vid2, images.vid3].map((img, index) => (
                            <Box
                                key={index}
                                sx={{
                                    flexGrow: 1,
                                    height: '100%',
                                    borderRadius: '10px',
                                    backgroundImage: `url(${img})`,
                                    backgroundSize: '100% auto',
                                    backgroundRepeat: 'repeat-y',
                                    animationDuration: '32s',
                                    animationIterationCount: 'infinite',
                                    animationTimingFunction: 'linear',
                                    animationName: index % 2 === 0 ? 'scrollUpAnimation' : 'scrollDownAnimation',
                                    '@keyframes scrollUpAnimation': {
                                        '0%': { backgroundPositionY: '0%' },
                                        '100%': { backgroundPositionY: '-100%' },
                                    },
                                    '@keyframes scrollDownAnimation': {
                                        '0%': { backgroundPositionY: '-100%' },
                                        '100%': { backgroundPositionY: '0%' },
                                    },
                                }}
                            />
                        ))}
                    </Box>
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderRadius: '10px',
                        userSelect: 'none',
                    }} />
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            height: 'auto',
                            userSelect: 'none',
                        }}
                        component={'img'}
                        src={images.earth_gif}
                        alt="earth_gif"
                    />
                    <Typography sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'light.500',
                        fontWeight: 700,
                        fontSize: '28px !important',
                        userSelect: 'none',
                        width: '100%',
                        height: 'auto',
                        textAlign: 'center',
                    }}>
                        Finding your next match...
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default UserTwoBox;