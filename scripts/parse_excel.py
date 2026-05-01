#!/usr/bin/env python3
"""
解析题库 Excel 文件并生成 Supabase SQL 插入语句
"""
import pandas as pd
import json
import sys
import os

BASE_DIR = "/Users/zacheswdl/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_1n7jxxl1vwsr22_0054/msg/file/2026-04"

def clean_text(text):
    """清理文本"""
    if pd.isna(text):
        return ""
    return str(text).strip().replace("'", "''")

def parse_single_choice(filepath):
    """解析单选题 .xlsx"""
    print("-- ===== 单选题 =====", file=sys.stderr)
    df = pd.read_excel(filepath, sheet_name="Sheet1", dtype=str)
    # 跳过前2行表头
    df = df.iloc[2:].reset_index(drop=True)
    
    inserts = []
    for _, row in df.iterrows():
        content = clean_text(row.iloc[2])  # *题目描述
        if not content:
            continue
            
        opt1_label = clean_text(row.iloc[4])  # 选项1
        opt1_desc = clean_text(row.iloc[5])   # 选项1描述
        opt2_label = clean_text(row.iloc[6])  # 选项2
        opt2_desc = clean_text(row.iloc[7])   # 选项2描述
        opt3_label = clean_text(row.iloc[8])  # 选项3
        opt3_desc = clean_text(row.iloc[9])   # 选项3描述
        opt4_label = clean_text(row.iloc[10]) # 选项4
        opt4_desc = clean_text(row.iloc[11])  # 选项4描述
        
        answer = clean_text(row.iloc[12]) if len(row) > 12 else ""
        
        # 构建 options JSON
        options = {}
        if opt1_desc:
            options[opt1_label] = opt1_desc
        if opt2_desc:
            options[opt2_label] = opt2_desc
        if opt3_desc:
            options[opt3_label] = opt3_desc
        if opt4_desc:
            options[opt4_label] = opt4_desc
        
        if not options or not answer:
            continue
        
        opts_json = json.dumps(options, ensure_ascii=False)
        
        inserts.append(
            f"('single', 'chapter_single', '{content}', '{opts_json}'::jsonb, '{answer}', '')"
        )
    
    print(f"解析到 {len(inserts)} 道单选题", file=sys.stderr)
    return inserts


def parse_xls_generic(filepath, q_type, sheet_name=0):
    """解析 .xls 文件（多选/判断）"""
    print(f"-- ===== {q_type} =====", file=sys.stderr)
    df = pd.read_excel(filepath, sheet_name=sheet_name, header=None, dtype=str)
    
    inserts = []
    for _, row in df.iterrows():
        content = clean_text(row.iloc[1]) if len(row) > 1 else ""
        if not content:
            continue
        
        opt_a = clean_text(row.iloc[2]) if len(row) > 2 else ""
        opt_b = clean_text(row.iloc[3]) if len(row) > 3 else ""
        opt_c = clean_text(row.iloc[4]) if len(row) > 4 else ""
        opt_d = clean_text(row.iloc[5]) if len(row) > 5 else ""
        answer = clean_text(row.iloc[6]) if len(row) > 6 else ""
        
        if not answer:
            continue
        
        options = {}
        if opt_a:
            options["A"] = opt_a
        if opt_b:
            options["B"] = opt_b
        if opt_c:
            options["C"] = opt_c
        if opt_d:
            options["D"] = opt_d
        
        # 没有标准选项格式，也可以把整行作为判断
        if q_type == "judge" or q_type == "multiple":
            if not options:
                # 尝试用第 3/4 列作为判断选项
                options = {"A": "正确", "B": "错误"}
        
        if not options:
            continue
        
        opts_json = json.dumps(options, ensure_ascii=False)
        inserts.append(
            f"('{q_type}', 'chapter_{q_type}', '{content}', '{opts_json}'::jsonb, '{answer}', '')"
        )
    
    print(f"解析到 {len(inserts)} 道{q_type}题", file=sys.stderr)
    return inserts


def main():
    base = BASE_DIR
    
    # 先看看两个 xls 文件的结构
    for fname in ["多选200题(7.31核对).xls", "判断200题（7.23）答案(1)(4)(3).xls"]:
        fp = os.path.join(base, fname)
        print(f"\n--- 检查文件: {fname} ---", file=sys.stderr)
        try:
            df = pd.read_excel(fp, header=None, dtype=str)
            print(f"Shape: {df.shape}", file=sys.stderr)
            print(f"Columns: {list(df.columns)}", file=sys.stderr)
            for i in range(min(3, len(df))):
                print(f"Row {i}: {list(df.iloc[i])}", file=sys.stderr)
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            # Try other sheets
            xls = pd.ExcelFile(fp)
            print(f"Sheets: {xls.sheet_names}", file=sys.stderr)
            for sn in xls.sheet_names:
                df = pd.read_excel(fp, sheet_name=sn, header=None, dtype=str)
                print(f"  Sheet '{sn}' shape: {df.shape}", file=sys.stderr)
                for i in range(min(3, len(df))):
                    print(f"  Row {i}: {list(df.iloc[i])}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "inspect":
        main()
    else:
        # 生成 SQL
        single = parse_single_choice(os.path.join(BASE_DIR, "单选题(2)(2).xlsx"))
        # 多选和判断需要先检查结构
        print("\n需要先检查 .xls 文件结构...")
        main()
