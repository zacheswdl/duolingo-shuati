import { View, Text } from '@tarojs/components';
import Modal from './Modal';
import './DailyTaskModal.scss';

interface DailyTaskModalProps {
  visible: boolean;
  onClose: () => void;
  taskName: string;
  xpReward: number;
}

export default function DailyTaskModal({ visible, onClose, taskName, xpReward }: DailyTaskModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View className='daily-task-modal'>
        <Text className='daily-task-modal-icon'>⭐</Text>
        <Text className='daily-task-modal-title'>任务完成！</Text>
        <Text className='daily-task-modal-task'>{taskName}</Text>
        <View className='daily-task-modal-reward'>
          <Text className='daily-task-modal-reward-text'>+{xpReward} XP</Text>
        </View>
        <View className='daily-task-modal-btn' onClick={onClose}>
          <Text>领取奖励</Text>
        </View>
      </View>
    </Modal>
  );
}
