import os
import gspread
from google.oauth2.service_account import Credentials
from zoneinfo import ZoneInfo
from datetime import datetime

from config import GOOGLE_CREDENTIALS_FILE, GOOGLE_SHEET_ID, TIMEZONE

class SheetsManager:
    def __init__(self):
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        creds_json_env = os.getenv("GOOGLE_CREDENTIALS_JSON")
        if creds_json_env:
            import json
            creds_info = json.loads(creds_json_env)
            self.creds = Credentials.from_service_account_info(creds_info, scopes=self.scopes)
        elif os.path.exists(GOOGLE_CREDENTIALS_FILE):
            self.creds = Credentials.from_service_account_file(GOOGLE_CREDENTIALS_FILE, scopes=self.scopes)
        else:
            raise FileNotFoundError(f"Credentials file {GOOGLE_CREDENTIALS_FILE} or GOOGLE_CREDENTIALS_JSON env var not found!")
            
        self.client = gspread.authorize(self.creds)
        self.spreadsheet = self.client.open_by_key(GOOGLE_SHEET_ID)
        
        self.tz = ZoneInfo(TIMEZONE)
        
        # Ensure 'Hisoblar' sheet exists
        try:
            self.hisoblar_sheet = self.spreadsheet.worksheet("Hisoblar")
        except gspread.exceptions.WorksheetNotFound:
            self.hisoblar_sheet = self.spreadsheet.add_worksheet(title="Hisoblar", rows="1000", cols="12")
            headers = ["ID", "Sana", "Vaqt", "Klient", "Turi", "Summa", "Foiz %", "Ushlab qolingan", "Sof summa", "Kategoriya", "Izoh", "Balans"]
            self.hisoblar_sheet.append_row(headers)
            
        # Ensure 'Klientlar' sheet exists
        try:
            self.klientlar_sheet = self.spreadsheet.worksheet("Klientlar")
        except gspread.exceptions.WorksheetNotFound:
            self.klientlar_sheet = self.spreadsheet.add_worksheet(title="Klientlar", rows="1000", cols="2")
            headers = ["ID", "Ism"]
            self.klientlar_sheet.append_row(headers)

    def get_clients(self):
        records = self.klientlar_sheet.get_all_records()
        clients = []
        for r in records:
            if "ID" in r and "Ism" in r:
                clients.append({"id": r["ID"], "ism": r["Ism"]})
        return clients

    def add_client(self, ism):
        records = self.get_clients()
        if records:
            next_id = max([int(r["id"]) for r in records if str(r["id"]).isdigit()] + [0]) + 1
        else:
            next_id = 1
            
        self.klientlar_sheet.append_row([next_id, ism])
        return {"id": next_id, "ism": ism}

    def get_client_name(self, klient_id):
        clients = self.get_clients()
        for c in clients:
            if str(c["id"]) == str(klient_id):
                return c["ism"]
        return f"Klient {klient_id}"

    def get_next_id(self):
        records = self.hisoblar_sheet.get_all_records()
        if records:
            return max([int(r.get("ID", 0)) for r in records if str(r.get("ID", "")).isdigit()] + [0]) + 1
        return 1

    def calculate_balance(self):
        records = self.hisoblar_sheet.get_all_records()
        balance = 0.0
        for r in records:
            try:
                turi = str(r.get("Turi", "")).lower()
                # Sof summa for kirim, Summa for chiqim
                if turi == "kirim":
                    val = r.get("Sof summa", 0)
                else:
                    val = r.get("Summa", 0)
                
                # Replace comma with dot if string
                if isinstance(val, str):
                    val = val.replace(" ", "").replace(",", ".")
                
                amount = float(val) if val else 0.0
                
                if turi == "kirim":
                    balance += amount
                elif turi == "chiqim":
                    balance -= amount
            except (ValueError, TypeError):
                pass
        return int(balance)
        
    def get_balance(self):
        return self.calculate_balance()

    def append_kirim(self, klient_id, summa, foiz, kategoriya, izoh):
        now = datetime.now(self.tz)
        sana = now.strftime("%Y-%m-%d")
        vaqt = now.strftime("%H:%M")
        
        summa_val = float(summa)
        foiz_val = float(foiz) if foiz else 0.0
        ushlab_qolingan = (summa_val * foiz_val) / 100.0
        sof_summa = summa_val - ushlab_qolingan
        
        klient_name = self.get_client_name(klient_id)
        
        # Calculate new balance
        current_balance = self.get_balance()
        new_balance = current_balance + sof_summa
        
        row_id = self.get_next_id()
        
        row = [
            row_id,
            sana,
            vaqt,
            klient_name,
            "kirim",
            summa_val,
            foiz_val,
            ushlab_qolingan,
            sof_summa,
            kategoriya,
            izoh,
            int(new_balance)
        ]
        self.hisoblar_sheet.append_row(row)
        
        return {
            "id": row_id,
            "sana": sana,
            "vaqt": vaqt,
            "klient": klient_name,
            "turi": "kirim",
            "summa": summa_val,
            "foiz": foiz_val,
            "ushlab_qolingan": ushlab_qolingan,
            "sof_summa": sof_summa,
            "kategoriya": kategoriya,
            "izoh": izoh,
            "balans": int(new_balance)
        }

    def append_chiqim(self, klient_id, summa, kategoriya, izoh):
        now = datetime.now(self.tz)
        sana = now.strftime("%Y-%m-%d")
        vaqt = now.strftime("%H:%M")
        
        summa_val = float(summa)
        
        klient_name = self.get_client_name(klient_id)
        
        # Calculate new balance
        current_balance = self.get_balance()
        new_balance = current_balance - summa_val
        
        row_id = self.get_next_id()
        
        row = [
            row_id,
            sana,
            vaqt,
            klient_name,
            "chiqim",
            summa_val,
            "",
            "",
            "",
            kategoriya,
            izoh,
            int(new_balance)
        ]
        self.hisoblar_sheet.append_row(row)
        
        return {
            "id": row_id,
            "sana": sana,
            "vaqt": vaqt,
            "klient": klient_name,
            "turi": "chiqim",
            "summa": summa_val,
            "foiz": "",
            "ushlab_qolingan": "",
            "sof_summa": "",
            "kategoriya": kategoriya,
            "izoh": izoh,
            "balans": int(new_balance)
        }

    def get_sverka(self, klient_id):
        klient_name = self.get_client_name(klient_id)
        records = self.hisoblar_sheet.get_all_records()
        
        yozuvlar = []
        jami_kirim = 0.0
        jami_foiz = 0.0
        jami_sof_kirim = 0.0
        jami_chiqim = 0.0
        
        client_balance = 0.0
        
        for r in records:
            if str(r.get("Klient", "")).strip().lower() == str(klient_name).strip().lower():
                try:
                    turi = str(r.get("Turi", "")).lower()
                    summa = float(str(r.get("Summa", 0)).replace(" ", "").replace(",", ".") or 0)
                    foiz = float(str(r.get("Foiz %", 0)).replace(" ", "").replace(",", ".") or 0)
                    ushlab = float(str(r.get("Ushlab qolingan", 0)).replace(" ", "").replace(",", ".") or 0)
                    sof = float(str(r.get("Sof summa", 0)).replace(" ", "").replace(",", ".") or 0)
                    
                    if turi == "kirim":
                        jami_kirim += summa
                        jami_foiz += ushlab
                        jami_sof_kirim += sof
                        client_balance += sof
                    elif turi == "chiqim":
                        jami_chiqim += summa
                        client_balance -= summa
                        
                    yozuvlar.append({
                        "id": r.get("ID"),
                        "sana": r.get("Sana"),
                        "vaqt": r.get("Vaqt"),
                        "turi": turi,
                        "summa": int(summa),
                        "foiz": foiz,
                        "ushlab_qolingan": int(ushlab),
                        "sof_summa": int(sof) if turi == "kirim" else int(summa),
                        "kategoriya": r.get("Kategoriya", ""),
                        "izoh": r.get("Izoh", ""),
                        "balans": int(client_balance)
                    })
                except (ValueError, TypeError) as e:
                    pass

        return {
            "klient_id": klient_id,
            "klient_name": klient_name,
            "jami_kirim": int(jami_kirim),
            "jami_foiz": int(jami_foiz),
            "jami_sof_kirim": int(jami_sof_kirim),
            "jami_chiqim": int(jami_chiqim),
            "qoldiq_balans": int(client_balance),
            "yozuvlar": yozuvlar
        }

    def update_kirim(self, record_id, summa, foiz, kategoriya, izoh):
        all_values = self.hisoblar_sheet.get_all_values()
        
        target_row_index = None
        for idx, row in enumerate(all_values[1:], start=2):
            if row and str(row[0]).strip() == str(record_id).strip():
                target_row_index = idx
                break
                
        if target_row_index is None:
            raise ValueError(f"ID {record_id} topilmadi")
            
        summa_val = float(summa)
        foiz_val = float(foiz) if foiz else 0.0
        ushlab_qolingan = (summa_val * foiz_val) / 100.0
        sof_summa = summa_val - ushlab_qolingan
        
        # Update row cells (Columns: 6=Summa, 7=Foiz, 8=Ushlab, 9=Sof, 10=Kategoriya, 11=Izoh)
        # Using batch update
        cell_updates = [
            {"range": f"F{target_row_index}", "values": [[summa_val]]},
            {"range": f"G{target_row_index}", "values": [[foiz_val]]},
            {"range": f"H{target_row_index}", "values": [[ushlab_qolingan]]},
            {"range": f"I{target_row_index}", "values": [[sof_summa]]},
            {"range": f"J{target_row_index}", "values": [[kategoriya]]},
            {"range": f"K{target_row_index}", "values": [[izoh]]},
        ]
        self.hisoblar_sheet.batch_update(cell_updates)
        
        # Recalculate balances across sheet
        self.recalculate_all_balances()
        
        return {
            "id": record_id,
            "summa": summa_val,
            "foiz": foiz_val,
            "ushlab_qolingan": ushlab_qolingan,
            "sof_summa": sof_summa,
            "kategoriya": kategoriya,
            "izoh": izoh
        }

    def recalculate_all_balances(self):
        all_records = self.hisoblar_sheet.get_all_records()
        if not all_records:
            return
            
        running_balance = 0.0
        updates = []
        
        for idx, r in enumerate(all_records, start=2):
            try:
                turi = str(r.get("Turi", "")).lower()
                if turi == "kirim":
                    sof = float(str(r.get("Sof summa", 0)).replace(" ", "").replace(",", ".") or 0)
                    running_balance += sof
                elif turi == "chiqim":
                    summa = float(str(r.get("Summa", 0)).replace(" ", "").replace(",", ".") or 0)
                    running_balance -= summa
                    
                updates.append({"range": f"L{idx}", "values": [[int(running_balance)]]})
            except (ValueError, TypeError):
                pass
                
        if updates:
            self.hisoblar_sheet.batch_update(updates)


