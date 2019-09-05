import Knex = require('knex');
// ตัวอย่าง query แบบ knex
// getHospital(db: Knex,hn:any) {
//   return db('opdconfig as o')
//     .select('o.hospitalcode as hcode', 'o.hospitalname as hname')
// }
// ตัวอย่างการคิวรี่โดยใช้ raw MySqlConnectionConfig
// async getHospital(db: Knex,hn:any) {
//   let data = await knex.raw(`select * from opdconfig`);
// return data[0];
// }

export class HisHosxpv3Model {

  getHospital(db: Knex, providerCode: any, hn: any) {
    return db('opdconfig as o')
      .select('o.hospitalcode as provider_code', 'o.hospitalname as provider_name')
  }

  getProfile(db: Knex, hn: any) {
    return db('patient')
      .select('hn', 'cid', 'pname as title_name', 'fname as first_name', 'lname as last_name')
      .where('hn', hn)
  }

  // getServices(db: Knex, hn, dateServe) {
  //   return db('ovst as v')
  //     .select('v.vn as seq','v.vstdate as date_serv', 'v.vsttime as time_serv')
  //     .where('v.hn', hn)
  //     .where('v.vstdate', dateServe)
  // }
  async getServices(db: Knex, hn: any, dateServe: any) {
    let sql = await db.raw(`SELECT vn as seq,DATE_FORMAT(vstdate, '%Y-%m-%d') as date_serv,vsttime as time_serv
    from ovst WHERE hn = ? and vstdate = ?
    `, [hn, dateServe]);
    return sql[0];
  }

  getAllergyDetail(db: Knex, hn: any) {
    return db('opd_allergy')
      .select('agent as drug_name', 'symptom')
      .where('hn', hn);
  }

  getChronic(db: Knex, hn: any) {
    return db('person_chronic as pc')
      .select('pc.regdate as start_date', 'pc.icd10 as icd_code', 'i.name as icd_name')
      .leftOuterJoin('person as pe', 'pe.person_id', '=', 'pc.person_id')
      .leftOuterJoin('patient as pa', 'pa.cid', '=', 'pe.cid')
      .leftOuterJoin('icd101 as i', 'i.code', '=', 'pc.icd10')
      .where('pa.hn', hn);
  }

  getDiagnosis(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('ovstdiag as o')
      .select('o.vn as seq', 'o.vstdate as date_serv',
        'o.vsttime as time_serv', 'o.icd10 as icd_code', db.raw('if(i.tname is not null,i.tname,i.name) as icd_name'), 't.name as diag_type')
      .join('icd101 as i', 'i.code', '=', 'o.icd10')
      .join('diagtype as t', 't.diagtype', 'o.diagtype')
      .where('o.vn', vn);
  }

  async getProcedure(db: Knex, hn: any, dateServe: any, vn: any) {
    let data = await db.raw(`SELECT o.vn as seq,d.er_oper_code as procedure_code,e.name as procedure_name, o.vstdate as date_serv,
    vsttime as time_serv,date(d.begin_date_time) as start_date,time(d.begin_date_time) as start_time,date(d.end_date_time) as end_date,TIME(d.end_date_time) as end_time
    FROM doctor_operation as d
    LEFT OUTER JOIN ovst o on o.vn=d.vn
    LEFT OUTER JOIN er_oper_code as e on e.er_oper_code=d.er_oper_code
    WHERE o.vn = ?
    UNION
    SELECT o.vn as seq,e.er_oper_code as procedure_code,c.name as procedure_name, o.vstdate as date_serv,
    vsttime as time_serv,o.vstdate as start_date, time(e.begin_time) as start_time,o.vstdate as end_date,TIME(e.end_time) as end_time
    FROM er_regist_oper as e
    LEFT OUTER JOIN ovst o on o.vn=e.vn
    LEFT OUTER JOIN er_oper_code as c on c.er_oper_code=e.er_oper_code
    WHERE o.vn = ?
    UNION
    SELECT l.vn as seq,m.code as procedure_code, i.name as procedure_name,l.request_date as date_serv,l.request_time as time_serv,
    l.enter_date as start_date, l.enter_time as start_time, l.leave_date as end_date, l.leave_time as end_time
    from operation_list as l
    LEFT OUTER JOIN operation_detail as a on a.operation_id=l.operation_id
    LEFT OUTER JOIN operation_item as i on i.operation_item_id=a.operation_item_id
    LEFT OUTER JOIN icd9cm1 as m on m.code=i.icd9
    where l.confirm_receive = 'Y' and l.vn = ?
    UNION
    SELECT d.vn as seq,d.icd10 as procedure_code, i.name as procedure_name,s.vstdate as date_serv,
    s.vsttime as time_serv,d.vstdate as start_date, d.vsttime as start_time, d.vstdate as end_date, 
    d.vsttime as end_time
    from ovstdiag as d
    left outer join icd9cm1 i on i.code = d.icd10 
    LEFT OUTER JOIN ovst s on s.vn=d.vn
    where d.vn = ? and substring(d.icd10,1,1) in ('0','1','2','3','4','5','6','7','8','9')
    `, [vn, vn, vn, vn]);
    return data[0];
  }

  getRefer(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('referout as r')
      .select('o.vn as seq', 'o.vstdate as date_serv',
        'o.vsttime as time_serv', 'r.refer_hospcode as to_provider_code', 'h.name as to_provider_name',
        'c.name as refer_cause')
      .innerJoin('refer_cause as c', 'c.id', 'r.refer_cause')
      .innerJoin('ovst as o ', 'o.vn', 'r.vn')
      .innerJoin('hospcode as h', 'h.hospcode', 'r.refer_hospcode')
      .where('r.vn', vn);
  }

  getDrugs(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('opitemrece as o')
      .select('o.vn as seq', 'o.vstdate as date_serv', 'o.vsttime as time_serv',
        'o.icode as drugcode', 's.name as drug_name', 'o.qty', 's.units as unit',
        'u.name1 as usage_line1', 'u.name2 as usage_line2', 'u.name3 as usage_line3')
      .innerJoin('s_drugitems as s', 's.icode', 'o.icode')
      .innerJoin('drugusage as u', 'u.drugusage', 'o.drugusage')
      .where('o.vn', vn)
      .andWhereNot('o.drugusage', '')
  }

  getLabs(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('lab_order as l')
      .select('o.vstdate as date_serv', 'o.vsttime as time_serv',
        'o.vn as seq', 'ls.lab_items_name as lab_name', 'l.lab_order_result as lab_result',
        db.raw('ifnull(ls.lab_items_normal_value,"") as standard_result'))
      .innerJoin('lab_head as h', 'h.lab_order_number', 'l.lab_order_number')
      .innerJoin('ovst as o', 'o.vn', 'h.vn')
      .innerJoin('lab_items as ls', 'ls.lab_items_code', 'l.lab_items_code')
      .where('h.vn', vn)
      .whereNotNull('l.lab_order_result');
  }

  getVaccine(db: Knex, hn: any) {
    return db('person_vaccine_list as l')
      .select(db.raw(`l.vaccine_date as date_serv,o.vsttime as time_serv,v.vaccine_code,v.vaccine_name`))
      .innerJoin('person as p', 'p.person_id', 'l.person_id')
      .innerJoin('patient as e', 'e.cid', 'p.cid')
      .innerJoin('ovst as o', 'o.hn', 'e.hn')
      .innerJoin('person_vaccine as v', 'v.person_vaccine_id', 'l.person_vaccine_id')
      .where('o.hn', hn)
      .union(function () {
        this.select(db.raw(`o.vstdate as date_serv,o.vsttime as time_serv,v.vaccine_code,v.vaccine_name`))
          .innerJoin('ovst as o', 'o.vn', 'l.vn')
          .innerJoin('person_vaccine as v', 'v.person_vaccine_id', 'l.person_vaccine_id')
          .from('ovst_vaccine as l')
          .where('o.hn', hn);
      })
  }

  getAppointment(db: Knex, hn: any, dateServ: any, vn: any) {
    return db('oapp as o')
      .select('o.vn as seq', 'v.vstdate as date_serv', 'v.vsttime as time_serv',
        'c.name as department', 'o.nextdate as date', 'o.nexttime as time', 'o.app_cause as detail')
      .join('ovst as v', 'v.vn', 'o.vn')
      .join('clinic as c', 'c.clinic', 'o.clinic')
      .where('o.vn', vn);
  }

}
