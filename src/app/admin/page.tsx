"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

// 模拟数据用于管理
const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    type: "single",
    chapter: "chapter1",
    content: "以下哪个不是 JavaScript 的基本数据类型？",
    options: { A: "String", B: "Number", C: "Array", D: "Boolean" },
    correct_answer: "C",
    explanation: "Array 是引用类型，属于 Object。",
  },
  {
    id: 2,
    type: "single",
    chapter: "chapter1",
    content: "CSS 中，以下哪个属性用于实现弹性布局？",
    options: { A: "display: block", B: "display: flex", C: "display: inline", D: "display: table" },
    correct_answer: "B",
    explanation: "display: flex 使用 Flexbox 布局模型。",
  },
  {
    id: 3,
    type: "judge",
    chapter: "chapter1",
    content: "JavaScript 中 `===` 不进行类型转换，而 `==` 会进行类型转换。",
    options: { A: "正确", B: "错误" },
    correct_answer: "A",
    explanation: "严格相等运算符不进行类型转换。",
  },
];

const CHAPTER_OPTIONS = [
  { value: "chapter1", label: "第一章" },
  { value: "chapter2", label: "第二章" },
  { value: "chapter3", label: "第三章" },
];

type EditingQuestion = Partial<Question> & { isNew?: boolean };

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [editing, setEditing] = useState<EditingQuestion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  const filteredQuestions = questions.filter(
    (q) =>
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startAdd = () => {
    setEditing({
      id: Date.now(),
      type: "single",
      chapter: "chapter1",
      content: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: "A",
      explanation: "",
      isNew: true,
    });
  };

  const startEdit = (question: Question) => {
    setEditing({ ...question, isNew: false });
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const saveQuestion = () => {
    if (!editing || !editing.content?.trim()) {
      setMessage("请输入题目内容");
      return;
    }

    if (editing.isNew) {
      setQuestions((prev) => [...prev, editing as Question]);
      setMessage("✅ 题目添加成功！");
    } else {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editing.id ? (editing as Question) : q))
      );
      setMessage("✅ 题目更新成功！");
    }

    setEditing(null);
    setTimeout(() => setMessage(""), 2000);
  };

  const deleteQuestion = (id: number) => {
    if (confirm("确定删除这道题吗？")) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setMessage("✅ 题目已删除");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-700">📋 题库管理</h1>
        <Button variant="primary" size="sm" onClick={startAdd}>
          <Plus className="w-4 h-4 mr-1" />
          添加题目
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="搜索题目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#58cc02] transition font-medium placeholder:text-slate-400"
        />
      </div>

      {/* 提示消息 */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#d4edc9] border border-[#58cc02] rounded-2xl p-3 text-center text-sm font-medium text-[#58cc02]"
        >
          {message}
        </motion.div>
      )}

      {/* 编辑表单 */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-[#58cc02] rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-bold text-lg text-slate-700">
            {editing.isNew ? "添加新题目" : "编辑题目"}
          </h2>

          {/* 章节选择 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-500 mb-1 block">章节</label>
              <select
                value={editing.chapter}
                onChange={(e) => setEditing({ ...editing, chapter: e.target.value })}
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#58cc02]"
              >
                {CHAPTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 mb-1 block">题型</label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as Question["type"] })}
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#58cc02]"
              >
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
            </div>
          </div>

          {/* 题目内容 */}
          <div>
            <label className="text-sm font-medium text-slate-500 mb-1 block">题干</label>
            <textarea
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#58cc02] min-h-[80px] resize-none"
              placeholder="输入题目内容..."
            />
          </div>

          {/* 选项 */}
          <div>
            <label className="text-sm font-medium text-slate-500 mb-2 block">选项</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(editing.options || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                    {key}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        options: { ...editing.options, [key]: e.target.value } as Record<string, string>,
                      })
                    }
                    className="flex-1 p-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#58cc02]"
                    placeholder={`选项 ${key}`}
                  />
                  {editing.type !== "judge" && (
                    <button
                      onClick={() => {
                        const newOptions = { ...editing.options };
                        delete newOptions[key];
                        setEditing({ ...editing, options: newOptions });
                      }}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editing.type !== "judge" && (
              <button
                onClick={() => {
                  const keys = Object.keys(editing.options || {});
                  const nextKey = String.fromCharCode(65 + keys.length);
                  setEditing({
                    ...editing,
                    options: { ...editing.options, [nextKey]: "" } as Record<string, string>,
                  });
                }}
                className="mt-2 text-sm text-[#1cb0f6] font-medium hover:underline"
              >
                + 添加选项
              </button>
            )}
          </div>

          {/* 正确答案 */}
          <div>
            <label className="text-sm font-medium text-slate-500 mb-1 block">正确答案</label>
            <select
              value={editing.correct_answer}
              onChange={(e) => setEditing({ ...editing, correct_answer: e.target.value })}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#58cc02]"
            >
              {Object.keys(editing.options || { A: "" }).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* 解析 */}
          <div>
            <label className="text-sm font-medium text-slate-500 mb-1 block">解析</label>
            <textarea
              value={editing.explanation}
              onChange={(e) => setEditing({ ...editing, explanation: e.target.value })}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#58cc02] min-h-[60px] resize-none"
              placeholder="输入解析说明..."
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <Button variant="primary" size="lg" className="flex-1" onClick={saveQuestion}>
              <Check className="w-4 h-4 mr-1" />
              保存
            </Button>
            <Button variant="ghost" size="lg" className="flex-1" onClick={cancelEdit}>
              取消
            </Button>
          </div>
        </motion.div>
      )}

      {/* 题目列表 */}
      <div className="space-y-2">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">暂无匹配题目</div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {CHAPTER_OPTIONS.find((o) => o.value === question.chapter)?.label || question.chapter}
                    </span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      question.type === "judge" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
                    )}>
                      {question.type === "judge" ? "判断" : "单选"}
                    </span>
                    <span className="text-xs text-slate-400">ID: {question.id}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">
                    {question.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    正确答案: {question.correct_answer} | {question.explanation}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(question)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#1cb0f6] transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#ff4b4b] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        共 {questions.length} 道题目
      </div>
    </div>
  );
}
