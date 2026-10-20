# Named Data Source audit — 2026-10-20

## คำถาม
ตรวจว่า Named Data Source ตามภาพมีปัญหาหรือไม่ โดยไม่แก้ไฟล์ application.

## ผลที่ยืนยันจากโค้ดและการรันซ้ำ

**ยืนยันบั๊กด้านความสอดคล้องหลังลบจาก sidebar:**

1. Data Sources sidebar แสดงรายการจาก `editing.data_sources` เท่านั้น (`gui/data-sources.js`, `render`).
2. เมื่อลบรายการ `removeSource` ลบเฉพาะ `editing.data_sources[name]` และ `editing.values[name]` แล้วเรียก `touchEditor`.
3. `touchEditor` เรียก `SourceModel.reconcileInPlace` แต่ reconciliation เก็บ `sourceDefinitions` เดิมไว้ และอัปเดต legacy definition จาก `data_sources` เฉพาะเมื่อ key ยังอยู่ (`gui/source-model.js`).
4. Dropdown ชนิด Named Data Source อ่านรายการจาก `snapshot().sourceDefinitions` ไม่ใช่ `data_sources` (`gui/object-data-sources-ui.js`). Resolver ยังประเมิน definition เดิมและส่งค่าต่อให้ object (`gui/source-resolver.js`).

การทำซ้ำแบบแยกจากข้อมูลจริงของผู้ใช้:

```
ก่อนลบ object แสดงค่า: OLD
ลบ data_sources.fawfwa แล้วเรียก reconcileInPlace
หลังลบ object แสดงค่า: OLD
data_sources: ว่าง
object ยังอ้างถึง source เดิม: true
sourceDefinitions ยังมี source เดิม: true
```

ผลจากคำสั่ง Node ที่ใช้ `SourceModel.migrate`, ลบ key ตาม `removeSource`, `SourceModel.reconcileInPlace`, และ `SourceResolver.evaluateDocument`. ดังนั้นหลังลบจากรายการ ชื่อยังอยู่ใน registry/dropdown และค่าจาก source เก่ายังไหลไปยังวัตถุได้ ขอบเขตที่ยืนยันคือ source แบบเดิม (`kind: legacy`) ใน schema 1.

## REA / BarTender evidence

- อ่าน REA skill/workflow และใช้ REA 6.7.0 CLI `inspect-managed-members` กับ installed `BarTender.Managed.dll`.
- Artifact: `C:/Windows/Microsoft.NET/assembly/GAC_64/BarTender.Managed/v4.0_12.1.0.1__109ff779a1b4cbc7/BarTender.Managed.dll`, SHA-256 `f32a25aee51846c2a33fcaa20f42dd23eee38554b2c172608efb3ce0fd12f389`.
- Evidence ID `ev_ebd1f3cd14e6a87b05f4db7cda726826a50570a9f745c3559576686a26eecf5a`, output `D:/QLabel-agent-work/rea-20261020/named-data-source-evidence.json`.
- Query type `BarTender.Managed.ConditionalPrinting.DelegateShowNamedDataSources` has complete metadata coverage and reveals a delegate hook for presenting named data sources. Static metadata does not reveal native deletion policy or live dropdown contents. No native BarTender dialog interaction was performed, so the desired behavior after deleting a referenced source remains unverified.
- App artifact identity reused from the matching retained REA inspection: `D:/Programs/BarTend.exe`, SHA-256 `0414401957c22df9c7bee4771934ccb5921b490afabe32c6b03e44b7e3bbf4d3`.

## Verification

- `node --test test/source-model.test.js test/source-resolver.test.js test/object-data-sources-ui.test.js test/source-wizard.test.js test/data-sources-ui.test.js`: 110 passed, 0 failed/skipped.
- Focused reproduction above returned exit code 0 and the stale registry/live-value result.
- This was an audit only; no application code or behavior was changed. The existing tests cover source creation, links, shared edits and resolution but do not assert removal cleanup across the sidebar and schema-1 registry.

## Conclusion

Named source creation/linking and shared-value tests currently pass. The delete path is inconsistent across the legacy sidebar store and the schema-1 source registry, and a removed named source may remain active and selectable. Native BarTender's exact delete-with-dependents policy is unknown. A follow-up fix needs to define whether deletion removes dependent references, replaces them with embedded values, or blocks removal; automatic deletion without that policy could change label output.
