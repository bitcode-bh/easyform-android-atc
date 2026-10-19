"""Execute the native store's actual SQL statements in a host-only temporary DB."""
from pathlib import Path
import json, re, sqlite3, unittest
source=Path('EasyFormSE_finance/src/com/sky/atc/easyformse/FormDraftStore.java').read_text()
sql=re.findall(r'database\.execSQL\("([^"]+)"',source)
def statement(prefix):
    matches=[text for text in sql if text.startswith(prefix)]
    assert len(matches)==1,(prefix,matches)
    return matches[0]
class DraftSQL(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        for name in ['FORMS','FIELDS']:
            self.db.execute(re.search(r'\b'+name+r' = "([^"]+)"',source).group(1))
        self.db.execute(statement('INSERT OR IGNORE INTO ui_form_drafts'),('scope',0))
    def tearDown(self): self.db.close()
    def write(self,revision,value):
        self.db.execute(statement('INSERT OR IGNORE INTO ui_form_draft_fields(scope,field,revision,payload) VALUES(?,?,0'),('scope','1'))
        self.db.execute(statement('UPDATE ui_form_draft_fields SET revision=?,payload=?'),(revision,json.dumps(value),'scope','1',revision))
    def ack(self,revision):
        self.db.execute(statement('UPDATE ui_form_draft_fields SET revision=?,payload=NULL'),(revision,'scope','1',revision))
        self.db.execute(statement('INSERT OR IGNORE INTO ui_form_draft_fields(scope,field,revision,payload) VALUES(?,?,?,NULL)'),('scope','1',revision))
    def row(self): return self.db.execute('SELECT revision,payload FROM ui_form_draft_fields').fetchone()
    def test_delayed_lower_and_equal_revisions_do_not_overwrite(self):
        self.write(2,"Worker's \"answer\"");self.write(1,'old');self.write(2,'duplicate');self.assertEqual(self.row(),(2,json.dumps("Worker's \"answer\"")))
    def test_ack_before_delayed_write_is_a_tombstone(self):
        self.ack(5);self.write(5,'late');self.write(4,'older');self.assertEqual(self.row(),(5,None));self.write(6,'next edit');self.assertEqual(json.loads(self.row()[1]),'next edit')
    def test_ack_advances_the_existing_tombstone_revision(self):
        self.write(1,'old');self.ack(5);self.write(3,'late');self.assertEqual(self.row(),(5,None))
    def test_ack_keeps_later_edits(self):
        self.write(6,'keep');self.ack(5);self.assertEqual(self.row(),(6,json.dumps('keep')))
    def test_discard_invalidates_lease_and_only_its_own_fields(self):
        self.write(1,'remove');self.db.execute(statement('INSERT OR IGNORE INTO ui_form_draft_fields(scope,field,revision,payload) VALUES(?,?,0'),('other','1'))
        self.db.execute(statement('UPDATE ui_form_drafts SET lease=lease+1'),(1,'scope'));self.db.execute(statement('DELETE FROM ui_form_draft_fields'),('scope',));self.assertEqual(self.db.execute('SELECT lease FROM ui_form_drafts').fetchone()[0],1);self.assertEqual(self.db.execute('SELECT scope FROM ui_form_draft_fields').fetchall(),[('other',)])
if __name__=='__main__': unittest.main()
