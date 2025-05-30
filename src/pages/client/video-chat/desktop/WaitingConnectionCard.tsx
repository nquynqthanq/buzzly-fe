import { Box } from '@mui/material';
import ImageScrollInfinity from '../components/ImageScrollInfinity';
import WaitingConnectionBox from './WaitingConnectionBox';
import { GENDER } from '@enums/video-chat';

interface WaitingConnectionCardProps {
    handleCountrySelect: (country: string) => void;
    handleGenderSelect: (gender: GENDER) => void;
    handleStartVideoChat: () => void;
    stream: MediaStream | null;
}

const WaitingConnectionCard = ({ handleCountrySelect, handleGenderSelect, handleStartVideoChat, stream }: WaitingConnectionCardProps) => {
    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            gap: '10px',
        }}>
            <WaitingConnectionBox
                handleCountrySelect={handleCountrySelect}
                handleGenderSelect={handleGenderSelect}
                handleStartVideoChat={handleStartVideoChat}
                stream={stream}
            />
            <ImageScrollInfinity />
        </Box>
    );
};

export default WaitingConnectionCard;