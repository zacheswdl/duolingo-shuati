import { ReactNode } from 'react';
import { View, Text } from '@tarojs/components';
import './Modal.scss';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({ visible, onClose, children, title }: ModalProps) {
  if (!visible) return null;

  return (
    <View className='modal-overlay' onClick={onClose}>
      <View className='modal-container' onClick={(e) => e.stopPropagation()}>
        <View className='modal-header'>
          {title && <Text className='modal-title'>{title}</Text>}
          <Text className='modal-close' onClick={onClose}>✕</Text>
        </View>
        <View className='modal-body'>
          {children}
        </View>
      </View>
    </View>
  );
}
