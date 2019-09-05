import Knex = require('knex');
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;
const hospcode = process.env.HIS_CODE;

export class HisHomcModel {

  async getHospital(db: Knex, providerCode: any, hn: any) {
    let data = await db.raw(`SELECT OFF_ID as provider_code,rtrim(NAME) as provider_name from HOSPCODE where OFF_ID = '${providerCode}'`);
    return data[0];
  }

  async getProfile(db: Knex, hn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select p.hn as hn,rtrim(t.titleName) as title_name,rtrim(p.firstName) as first_name,rtrim(p.lastName) as last_name,rtrim(s.CardID) as cid
    from PATIENT p left join PTITLE t on p.titleCode=t.titleCode left join PatSS s on p.hn=s.hn where p.hn='${HN}'`);
    //console.log('Vaccine', data);
    return data[0];
  }

  async getVaccine(db: Knex, hn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select convert(date,convert(char,o.registDate -5430000)) as date_serv,
    CONVERT (time,(left (o.timePt,2)+':'+right (o.timePt,2))) as time_serv,
    p.VACCODE as vaccine_code,v.VACNAME as vaccine_name
    from PPOP_EPI p
    left join OPD_H o on(o.hn = p.HN and p.REGNO = o.regNo)
    left join PPOP_VACCINE v on(v.VACCODE = p.VACCODE)
    where o.hn = '${HN}'`);
    // console.log('Vaccine', data);
    return data[0];
  }

  async getChronic(db: Knex, hn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select distinct rtrim(p.ICDCode) as icd_code,rtrim(ic.DES) as icd_name--,p.VisitDate as start_date
    from PATDIAG p
    left join OPD_H o on(o.hn = p.Hn and o.regNo = p.regNo)
    left join ICD101 ic on(ic.CODE = p.ICDCode)
    where o.hn='${HN}' and  p.DiagType in('I') and p.dxtype = '1'
    and
    ( p.ICDCode between 'I60' and 'I698' or p.ICDCode between 'J45' and 'J46' or p.ICDCode between 'I10' and 'I159'
    or p.ICDCode between 'A15' and 'A199' or p.ICDCode between 'E10' and 'E149' or p.ICDCode between 'F30' and 'F399'
    or p.ICDCode between 'J43' and 'J449' or p.ICDCode between 'J429' and 'J429' or p.ICDCode between 'I20' and 'I259'
    or p.ICDCode between 'I05' and 'I099' or p.ICDCode between 'I26' and 'I289' or p.ICDCode between 'I30' and 'I528'
    or p.ICDCode between 'G80' and 'G839' or p.ICDCode between 'D50' and 'D649' or p.ICDCode between 'N17' and 'N19'
    )`);
    // const result = await db.raw(sql, [hn]);
    return data[0];
  }

  async getAllergyDetail(db: Knex, hn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select v.gen_name as drug_name,m.alergyNote as symptom from medalery m left join Med_inv v on m.medCode=v.abbr where hn='${HN}'`);
    return data[0];
  }

  async getServices(db: Knex, hn: any, dateServe: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`SELECT o.hn + o.regNo as seq,
    convert(date,convert(char,o.registDate -5430000)) as date_serv,
    CONVERT (time,(left (o.timePt,2)+':'+right (o.timePt,2))) as time_serv,
    d.deptDesc as department
    from OPD_H as o
    left join DEPT d on(d.deptCode = o.dept)
    where o.hn = '${HN}' and convert(date,convert(char,o.registDate -5430000)) = '${dateServe}'`);
    return data[0];
  }

  async getDiagnosis(db: Knex, hn: any, dateServe: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select o.hn + p.regNo as seq,
    convert(date,convert(char,p.VisitDate -5430000)) as date_serv,
    SUBSTRING(o.timePt,1,2)+':'+SUBSTRING(o.timePt,3,4) as time_serv,rtrim(p.ICDCode) as icd_code,rtrim(ic.DES) as icd_name,p.DiagType as diag_type
    from PATDIAG p
    left join OPD_H o on(o.hn = p.Hn and o.regNo = p.regNo)
    left join ICD101 ic on(ic.CODE = p.ICDCode)
    where p.DiagType in('I','E') and p.pt_status in('O','Z')
    and o.hn = '${HN}' and convert(date,convert(char,p.VisitDate -5430000)) = '${dateServe}'`);
    return data[0];
  }

  async getRefer(db: Knex, hn: any, dateServe: any, vn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select r.RegNo as seq,r.ReferDate as date_serv,'00:00:00' as time_serv,r.ReferHCODE as to_provider_code,h.OFF_NAME2 as to_provider_name,s.REASON_DESC as reason,
    '' as start_date from Refer r left join HOSPCODE h on r.ReferHCODE=h.OFF_ID
    left join REFERRS s on r.ReferReason=s.REASON_CODE where r.Hn='${HN}' and r.ReferDate='${dateServe}'`);
    //return db.raw(sql, [vn]);
    //const result = db.raw(sql, [hn,dateServe,vn]);
    return data[0];

  }

  async getProcedure(db: Knex, hn: any, dateServe: any, vn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select o.REGNO as seq ,
    (o.OR_DATE) as date_serv, o.OR_TIME as time_serv,o.ORCODE as procedure_code,o.ORDESC as icd_name,
    (o.START_DATE) as start_date,(o.END_DATE) as end_date
    from ORREQ_H o
    left join OPD_H p on( o.HN = p.hn and o.REGNO = p.regNo)
    where o.HN='${HN}' and p.registDate = '${dateServe}'`);
    return data[0];
  }

  async getDrugs(db: Knex, hn: any, dateServe: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select p.hn + p.registNo as seq,
    convert(date,convert(char,p.registDate -5430000)) as date_serv,
    convert(char(5), p.firstIssTime, 108) as time_serv,rtrim(m.name) as drug_name,
    p.qty as qty,rtrim(p.unit) as unit,rtrim(p.lamedTimeText) as usage_line1,rtrim(p.lamedText) as usage_line2, '' as usage_line3
    from Patmed p
    left join Med_inv m on (m.code = p.invCode)
    left join Deptq_d d on (d.hn = p.hn and d.regNo = p.registNo)
    left join OPD_H h on( p.hn = h.hn and p.registNo = h.regNo)
    where p.hn = '${HN}' and convert(date,convert(char,p.registDate -5430000)) = '${dateServe}'`);
    return data[0];
  }

  async getLabs(db: Knex, hn: any, dateServe: any, vn: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select l.hn + l.reg_flag as seq,
    convert(date,convert(char,l.res_date -5430000)) as date_serv,
    SUBSTRING(l.res_time,1,2)+':'+SUBSTRING(l.res_time,3,4) as time_serv,rtrim(l.result_name) as lab_name,
    l.real_res as lab_result,rtrim(replace(l.low_normal,'999999.999',''))+'-'+rtrim(replace(l.high_normal,'999999.999','')) as standard_result
    from Labres_d l where l.hn = '${HN}'
    and convert(date,convert(char,l.res_date -5430000)) = '${dateServe}'`);
    return data[0];
  }

  async getAppointment(db: Knex, hn: any, dateServe: any) {
    let HN = ("     " + hn).slice(-7);
    let data = await db.raw(`select p.hn + p.regNo as seq,a.pre_dept_code as clinic,
    convert(date,convert(char,p.registDate -5430000)) as date_serv,
    SUBSTRING(p.timePt,1,2)+':'+SUBSTRING(p.timePt,3,4) as time_serv,
    convert(date,convert(char,a.appoint_date -5430000)) as appoint_date,
    a.appoint_time_from as appoint_time,a.appoint_note as detail
    from Appoint a
    left join OPD_H p on( a.hn = p.hn and a.regNo = p.regNo)
    where p.hn = '${HN}' and convert(date,convert(char,p.registDate -5430000)) = '${dateServe}'`);
    return data[0];
  }
}