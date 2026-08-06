import json

path = 'd:/Travel.IO/ref_brain/4aece3ff-d165-4964-bed6-190e4ac83b0f/.system_generated/logs/transcript.jsonl'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = [json.loads(l) for l in f]

user_msgs = [l for l in lines if l.get('type') == 'USER_INPUT']
model_msgs = [l for l in lines if l.get('type') == 'PLANNER_RESPONSE']

with open('d:/Travel.IO/temp_ref_summary.txt', 'w', encoding='utf-8') as out:
    out.write("=== USER MESSAGES ===\n")
    for m in user_msgs:
        content = m.get('content', '')[:300]
        out.write(f"Step {m['step_index']}: {content}\n---\n")
    
    out.write("\n=== LAST 5 MODEL RESPONSES ===\n")
    for m in model_msgs[-5:]:
        content = m.get('content', '')[:500]
        out.write(f"Step {m['step_index']}: {content}\n---\n")

print(f"Total user msgs: {len(user_msgs)}, model msgs: {len(model_msgs)}, total steps: {len(lines)}")
