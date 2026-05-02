import { View, Text } from '@tarojs/components';
import Modal from './Modal';
import './CheckinModal.scss';

interface CheckinModalProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
}

export default function CheckinModal({ visible, onClose, streak }: CheckinModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View className='checkin-modal'>
        <Text className='checkin-modal-icon'>🔥</Text>
        <Text className='checkin-modal-title'>连胜打卡！</Text>
        <Text className='checkin-modal-streak'>{streak} 天</Text>
        <Text className='checkin-modal-desc'>坚持每天学习，保持连胜！</Text>
        <View className='checkin-modal-btn' onClick={onClose}>
          <Text>继续加油！</Text>
        </View>
      </View>
    </Modal>
  );
}
