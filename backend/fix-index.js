// Commandes MongoDB pour corriger l'index
db.users.dropIndex("referralCode_1");
db.users.createIndex({referralCode: 1}, {unique: true, sparse: true});
print("✅ Index corrigé");
