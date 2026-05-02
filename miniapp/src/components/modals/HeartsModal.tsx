import { View, Text } from '@tarojs/components';
import Modal from './Modal';
import './HeartsModal.scss';

interface HeartsModalProps {
  visible: boolean;
  onClose: () => void;
  hearts: number;
}

export default function HeartsModal({ visible, onClose, hearts }: HeartsModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View className='hearts-modal'>
        <Text className='hearts-modal-icon'>❤️</Text>
        <Text className='hearts-modal-title'>红心不足</Text>
        <Text className='hearts-modal-count'>当前红心：{hearts}</Text>
        <Text className='hearts-modal-desc'>红心不足，无法继续答题</Text>
        <View className='hearts-modal-btn' onClick={onClose}>
          <Text>返回</Text>
        </View>
      </View>
    </Modal>
  );
}
