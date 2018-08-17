"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbName = process.env.HIS_DB_NAME;
class HisHiModel {
    getHospital(db) {
        return db('setup as s')
            .select('s.hcode as hcode', 'h.namehosp as hname')
            .leftJoin('hospcode as h', 'h.off_id', '=', 's.hcode');
    }
    getPtDetail(db, hn) {
        return db('pt')
            .select('pop_id as cid', 'pname as title_name', 'fname as first_name', 'lname as last_name')
            .where('hn', hn);
    }
    getAllergyDetail(db, hn) {
        return db('allergy')
            .select('namedrug', 'detail')
            .where('hn', hn);
    }
    getBloodgrp(db, hn) {
        return db('pt')
            .select('bloodgrp as blood_group')
            .where('hn', hn);
    }
    getSex(db, hn) {
        return db('pt')
            .select('male')
            .where('hn', hn);
    }
    getDisease(db, hn) {
        return db('chronic as c')
            .select('c.chronic as icd10_code', 'i.name_t as icd10_desc', 'c.date_diag as start_date')
            .innerJoin('icd101 as i', 'i.icd10', '=', 'c.chronic')
            .where('c.pid', hn);
    }
    getSeq(db, date_serve, hn) {
        let sql = `
        select o.vn as seq, o.vstdttm as date, o.nrxtime as time, c.namecln as department
        FROM ovst as o 
        Inner Join cln as c ON c.cln = o.cln 
        WHERE DATE(o.vstdttm) = ? and o.hn =?
        `;
        return db.raw(sql, [date_serve, hn]);
    }
    getDate(db, vn) {
        return db('ovst as o')
            .select('o.vstdttm as date')
            .where('vn', vn);
    }
    getTime(db, vn) {
        return db('ovst as o')
            .select('o.nrxtime as time')
            .where('vn', vn);
    }
    getDepartment(db, vn) {
        return db('ovst as o')
            .select('c.namecln as department')
            .innerJoin('cln as c', 'c.cln', '=', 'o.cln')
            .where('vn', vn);
    }
    getScreening(db, vn) {
        return db('ovst as o')
            .select('o.bw as weight', 'o.bw as height', 'o.dbp as dbp', 'o.sbp as sbp', 'o.bmi as bmi')
            .where('vn', vn);
    }
    getPe(db, vn) {
        return db('sign as s')
            .select('s.sign as pe')
            .where('vn', vn);
    }
    getDiagnosis(db, vn) {
        return db('ovstdx as o')
            .select('o.icd10 as icd10_code', 'o.icd10name as icd10_desc', 'o.cnt as diage_type')
            .where('vn', vn);
    }
    getRefer(db, vn) {
        return db('orfro as o')
            .select('o.rfrlct as hcode_to', 'h.namehosp as name_to', 'f.namerfrcs as reason')
            .leftJoin('hospcode as h', 'h.off_id', '=', 'o.rfrlct')
            .leftJoin('rfrcs as f', 'f.rfrcs', '=', 'o.rfrcs')
            .where('vn', vn);
    }
    getDrugs(db, vn) {
        let sql = `
        select pd.nameprscdt as drug_name,pd.qty as qty, med.pres_unt as unit ,m.doseprn1 as usage_line1 ,m.doseprn2 as usage_line2,'' as usage_line3
        FROM prsc as p 
        Left Join prscdt as pd ON pd.PRSCNO = p.PRSCNO 
        Left Join medusage as m ON m.dosecode = pd.medusage
        Left Join meditem as med ON med.meditem = pd.meditem
        WHERE p.vn = ?
        `;
        return db.raw(sql, [vn]);
    }
    getLabs(db, vn) {
        let sql = `
        SELECT 
        
        lab_test as lab_name,
        hi.Get_Labresult(t.lab_table,t.labfield,t.lab_number) as lab_result,
        reference as standard_result
        FROM
        (SELECT DISTINCT
        l.ln as lab_number,
        l.vn as seq,
        l.hn as hn,
        lb.fieldname as lab_code_local,
        
        replace(lb.fieldlabel,"'",'\`') as lab_test, lb.filename as lab_table,
        lb.fieldname as labfield,
        concat(lb.normal,' ',lb.unit) as reference,
        replace(lab.labname,"'",'\`') as lab_group_name,
        l.labcode as lab_group
        FROM 
        hi.lbbk as l 
        inner join hi.lab on l.labcode=lab.labcode and l.finish=1 and l.vn=?
        inner join hi.lablabel as lb on l.labcode = lb.labcode
        group by l.ln,l.labcode,lb.filename,lb.fieldname
        ) as t 
        `;
        return db.raw(sql, [vn]);
    }
    getAnc(db, vn) {
        let sql = `
        select 
        ga,
        g as anc_no,
        ancresult as result
        from anc 
        where vn = ? 
        `;
        return db.raw(sql, [vn]);
    }
    getVaccine(db, vn) {
        let sql = `
        select 
        cv.NEW as vaccine_code, 
        h.namehpt as vaccine_name
        from 
        hi.epi e 
        inner join 
        hi.ovst o on e.vn = o.vn 
        inner join 
        hi.cvt_vacc cv on e.vac = cv.OLD  
        left join 
        hi.hpt as h on e.vac=h.codehpt
        where 
        o.vn=?
        
        UNION

        select 
        vc.stdcode as vacine_code, 
        vc.\`name\` as vacine_name
        from 
        hi.ovst o 
        inner join 
        hi.prsc pc on o.vn = pc.vn  
        inner join 
        hi.prscdt pd on pc.prscno = pd.prscno  
        inner join 
        hi.meditem m on pd.meditem = m.meditem 
        inner join 
        hi.vaccine vc on vc.meditem = m.meditem  
        where 
        o.vn=?
        `;
        return db.raw(sql, [vn, vn]);
    }
    getLabTable(db, lab_name, ln) {
        let sql = `select * from ? WHERE ln = ?`;
        return db.raw(sql, [lab_name, ln]);
    }
    getAppointment(db, vn) {
        return db('oapp as o')
            .select('o.fudate as date', 'o.futime as time', 'o.cln as department', 'o.dscrptn as detail')
            .where('vn', vn);
    }
    getEpiAll(db, hn) {
        let sql = `select 
        o.vstdttm as date_serve,
        o.drxtime as time_serve,
        cv.NEW as vaccine_code, 
        h.namehpt as vaccine_name
        from 
        hi.epi e 
        inner join 
        hi.ovst o on e.vn = o.vn 
        inner join 
        hi.cvt_vacc cv on e.vac = cv.OLD  
        left join 
        hi.hpt as h on e.vac=h.codehpt
        where 
        o.hn=?
        
        UNION

        select 
        o.vstdttm as date_serve,
        o.drxtime as time_serve,
        vc.stdcode as vacine_code, 
        vc.\`name\` as vacine_name
        from 
        hi.ovst o 
        inner join 
        hi.prsc pc on o.vn = pc.vn  
        inner join 
        hi.prscdt pd on pc.prscno = pd.prscno  
        inner join 
        hi.meditem m on pd.meditem = m.meditem 
        inner join 
        hi.vaccine vc on vc.meditem = m.meditem  
        where 
        o.hn=?
        `;
        return db.raw(sql, [hn, hn]);
    }
}
exports.HisHiModel = HisHiModel;
//# sourceMappingURL=his_hi.model.js.map