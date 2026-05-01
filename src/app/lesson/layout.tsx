type Props = {
  children: React.ReactNode;
};

const LessonLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
};

export default LessonLayout;
