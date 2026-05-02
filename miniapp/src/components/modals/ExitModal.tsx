import { View, Text } from '@tarojs/components';
import Modal from './Modal';
import './ExitModal.scss';

interface ExitModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExitModal({ visible, onConfirm, onCancel }: ExitModalProps) {
  return (
    <Modal visible={visible} onClose={onCancel}>
      <View className='exit-modal'>
        <Text className='exit-modal-icon'>⚠️</Text>
        <Text className='exit-modal-title'>确定退出？</Text>
        <Text className='exit-modal-desc'>进度将不会保存</Text>
        <View className='exit-modal-actions'>
          <View className='exit-modal-btn-outline' onClick={onCancel}>
            <Text>继续答题</Text>
          </View>
          <View className='exit-modal-btn-danger' onClick={onConfirm}>
            <Text>退出</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
