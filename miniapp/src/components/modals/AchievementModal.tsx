import { View, Text } from '@tarojs/components';
import Modal from './Modal';
import './AchievementModal.scss';

interface AchievementModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: {
    key: string;
    name: string;
    description: string;
  };
}

export default function AchievementModal({ visible, onClose, achievement }: AchievementModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View className='achievement-modal'>
        <Text className='achievement-modal-icon'>🏆</Text>
        <Text className='achievement-modal-label'>成就解锁！</Text>
        <Text className='achievement-modal-name'>{achievement.name}</Text>
        <Text className='achievement-modal-desc'>{achievement.description}</Text>
        <View className='achievement-modal-btn' onClick={onClose}>
          <Text>太棒了！</Text>
        </View>
      </View>
    </Modal>
  );
}
