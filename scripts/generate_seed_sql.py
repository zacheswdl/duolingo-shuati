#!/usr/bin/env python3
"""
完整的题库解析脚本 - 从三个 Excel 生成 Supabase SQL
"""
import pandas as pd
import json
import os
import re

BASE_DIR = "/Users/zacheswdl/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_1n7jxxl1vwsr22_0054/msg/file/2026-04"

def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).strip().replace("'", "''")

def parse_single_choice(filepath):
    """解析单选题 .xlsx"""
    df = pd.read_excel(filepath, sheet_name="Sheet1", dtype=str)
    df = df.iloc[2:].reset_index(drop=True)
    
    inserts = []
    for idx, row in df.iterrows():
        content = clean_text(row.iloc[2])
        if not content or len(content) < 5:
            continue
        
        # 选项分布在列 4(A标签),5(A描述),6(B标签),7(B描述),8(C标签),9(C描述),10(D标签),11(D描述)
        options = {}
        opt_labels = [clean_text(row.iloc[4]), clean_text(row.iloc[6]), clean_text(row.iloc[8]), clean_text(row.iloc[10])]
        opt_descs = [clean_text(row.iloc[5]), clean_text(row.iloc[7]), clean_text(row.iloc[9]), clean_text(row.iloc[11])]
        
        for lbl, desc in zip(opt_labels, opt_descs):
            if lbl and desc:
                options[lbl] = desc
        
        answer = clean_text(row.iloc[12]) if len(row) > 12 else ""
        
        if not options or not answer or len(answer) > 5:
            continue
        
        opts_json = json.dumps(options, ensure_ascii=False)
        inserts.append(
            f"('single', 'chapter_single', '{content}', '{opts_json}'::jsonb, '{answer}', '')"
        )
    
    print(f"✅ 单选题: {len(inserts)} 道")
    return inserts

def parse_multiple_choice(filepath):
    """解析多选题 .xls"""
    df = pd.read_excel(filepath, header=None, dtype=str)
    df = df.iloc[1:].reset_index(drop=True)  # 跳过表头
    
    inserts = []
    for _, row in df.iterrows():
        content = clean_text(row.iloc[1])
        if not content or len(content) < 5:
            continue
        
        opt_a = clean_text(row.iloc[2])  # A
        opt_a_desc = clean_text(row.iloc[3])
        opt_b = clean_text(row.iloc[4])  # B
        opt_b_desc = clean_text(row.iloc[5])
        opt_c = clean_text(row.iloc[6])  # C
        opt_c_desc = clean_text(row.iloc[7])
        opt_d = clean_text(row.iloc[8])  # D
        opt_d_desc = clean_text(row.iloc[9])
        
        answer = clean_text(row.iloc[10]) if len(row) > 10 else ""
        
        if not answer:
            continue
        
        options = {}
        if opt_a_desc:
            options[opt_a] = opt_a_desc
        if opt_b_desc:
            options[opt_b] = opt_b_desc
        if opt_c_desc:
            options[opt_c] = opt_c_desc
        if opt_d_desc:
            options[opt_d] = opt_d_desc
        
        opts_json = json.dumps(options, ensure_ascii=False)
        inserts.append(
            f"('multiple', 'chapter_multiple', '{content}', '{opts_json}'::jsonb, '{answer}', '')"
        )
    
    print(f"✅ 多选题: {len(inserts)} 道")
    return inserts

def parse_judge(filepath):
    """解析判断题 .xls"""
    df = pd.read_excel(filepath, header=None, dtype=str)
    df = df.iloc[1:].reset_index(drop=True)  # 跳过表头
    
    inserts = []
    for _, row in df.iterrows():
        content = clean_text(row.iloc[1])
        if not content or len(content) < 5:
            continue
        
        answer_raw = clean_text(row.iloc[2])
        explanation = clean_text(row.iloc[3]) if len(row) > 3 else ""
        
        # 转换 √/× 为 A/B
        if answer_raw == "√" or answer_raw.lower() == "正确":
            answer = "A"
        elif answer_raw == "×" or answer_raw.lower() == "错误":
            answer = "B"
        else:
            answer = answer_raw
        
        options = {"A": "正确", "B": "错误"}
        opts_json = json.dumps(options, ensure_ascii=False)
        
        inserts.append(
            f"('judge', 'chapter_judge', '{content}', '{opts_json}'::jsonb, '{answer}', '{explanation}')"
        )
    
    print(f"✅ 判断题: {len(inserts)} 道")
    return inserts

def write_sql(inserts, type_label, filepath):
    """分批写入 SQL"""
    # 按每50条一组
    batch_size = 50
    for i in range(0, len(inserts), batch_size):
        batch = inserts[i:i+batch_size]
        content = "INSERT INTO public.questions (type, chapter, content, options, correct_answer, explanation) VALUES\n"
        content += ",\n".join(batch) + ";\n\n"
        
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(f"-- {type_label} - 第{i//batch_size + 1}批 (第{i+1}-{min(i+batch_size, len(inserts))}题)\n")
            f.write(content)

def main():
    base = BASE_DIR
    output = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase-seed.sql")
    
    # 清空输出文件
    with open(output, "w", encoding="utf-8") as f:
        f.write("-- =============================================\n")
        f.write("-- Duolingo-shuati: 题库种子数据 (从 Excel 导入)\n")
        f.write("-- 总题数: " + "待计算" + "\n")
        f.write("-- 生成时间: " + pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S") + "\n")
        f.write("-- =============================================\n\n")
        f.write("-- 请先执行 supabase-schema.sql 建表，再执行此文件导入数据\n\n")
    
    # 解析单选题
    single_inserts = parse_single_choice(os.path.join(base, "单选题(2)(2).xlsx"))
    write_sql(single_inserts, "单选题", output)
    
    # 解析多选题
    multi_inserts = parse_multiple_choice(os.path.join(base, "多选200题(7.31核对).xls"))
    write_sql(multi_inserts, "多选题", output)
    
    # 解析判断题
    judge_inserts = parse_judge(os.path.join(base, "判断200题（7.23）答案(1)(4)(3).xls"))
    write_sql(judge_inserts, "判断题", output)
    
    # 更新总计
    total = len(single_inserts) + len(multi_inserts) + len(judge_inserts)
    with open(output, "r") as f:
        content = f.read()
    content = content.replace("总题数: \" + \"待计算\" + \"", f"总题数: {total}")
    with open(output, "w") as f:
        f.write(content)
    
    print(f"\n🎉 总计: {total} 道题")
    print(f"📁 输出文件: {output}")
    print(f"\n💡 使用方式:")
    print(f"   1. 先在 Supabase SQL Editor 执行 supabase-schema.sql")
    print(f"   2. 再执行 {output}")

if __name__ == "__main__":
    main()
