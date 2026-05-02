import { View, Text } from '@tarojs/components';
import Modal from './Modal';
import './PracticeModal.scss';

interface PracticeModalProps {
  visible: boolean;
  onClose: () => void;
  onPractice: () => void;
  chapterName: string;
  questionCount: number;
}

export default function PracticeModal({ visible, onClose, onPractice, chapterName, questionCount }: PracticeModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View className='practice-modal'>
        <Text className='practice-modal-icon'>📖</Text>
        <Text className='practice-modal-chapter'>{chapterName}</Text>
        <Text className='practice-modal-count'>共 {questionCount} 题</Text>
        <View className='practice-modal-actions'>
          <View className='practice-modal-btn-outline' onClick={onClose}>
            <Text>取消</Text>
          </View>
          <View className='practice-modal-btn-primary' onClick={onPractice}>
            <Text>开始练习</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
