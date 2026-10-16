"""Validate migration and query equivalence with the native table's TEXT affinity."""
import pathlib,re,sqlite3,unittest
ROOT=pathlib.Path(__file__).resolve().parents[3]
class TrackIndexTest(unittest.TestCase):
 def test_versioned_index_preserves_routes(self):
  source=(ROOT/'src/com/sky/atc/easyformse/MySQLiteHelper.java').read_text()
  create=re.search(r'DATABASE_CREATE31 = "([^"]+)"',source).group(1)
  index=re.search(r'"(CREATE INDEX IF NOT EXISTS index_track_master_date_tripflag[^"]+)"',source).group(1)
  db=sqlite3.connect(':memory:');db.execute(create)
  db.executemany('INSERT INTO track_master(date,tripflag,lat,lon) VALUES(?,?,?,?)',[(str(1700000000000+i),str(i%4),'18.5','73.8') for i in range(10000)])
  query='select lat,lon,tripflag from track_master where tripflag IN (2,3) and date>=1700000001000 and date<=1700000002000 order by date'
  before=db.execute(query).fetchall();db.execute(index);db.execute(index)
  self.assertEqual(before,db.execute(query).fetchall())
  self.assertTrue(any('index_track_master_date_tripflag' in r[3] for r in db.execute('EXPLAIN QUERY PLAN '+query)))
  self.assertIn('DATABASE_VERSION = 79',source);self.assertIn('if (oldVersion < 79)',source)
  db.close()
if __name__=='__main__':unittest.main()
