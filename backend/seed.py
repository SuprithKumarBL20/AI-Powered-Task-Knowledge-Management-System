import pymysql
from app.config import DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME
from app.database import Base, engine, SessionLocal
from app.models import Role, User
from app.auth import get_password_hash

def init_db():
    print("Connecting to MySQL to check/create database...")
    # Connect to MySQL server without selecting a database first
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=int(DB_PORT)
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        print(f"Database '{DB_NAME}' created or already exists.")
    except Exception as e:
        print(f"Error creating database: {e}")
        raise e
    finally:
        conn.close()

    print("Initializing tables via SQLAlchemy ORM...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

def seed_data():
    print("Seeding initial roles and users...")
    db = SessionLocal()
    try:
        # Seed Roles
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            admin_role = Role(name="Admin", description="Administrator with full access to upload documents and assign tasks.")
            db.add(admin_role)
            print("Added Admin role.")
            
        user_role = db.query(Role).filter(Role.name == "User").first()
        if not user_role:
            user_role = Role(name="User", description="Standard user who searches documents and completes tasks.")
            db.add(user_role)
            print("Added User role.")
            
        db.commit()
        # Refresh to get IDs
        if admin_role: db.refresh(admin_role)
        if user_role: db.refresh(user_role)

        # Get role IDs
        admin_role_id = db.query(Role).filter(Role.name == "Admin").first().id
        user_role_id = db.query(Role).filter(Role.name == "User").first().id

        # Seed Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role_id=admin_role_id
            )
            db.add(admin_user)
            print("Added admin user ('admin' / 'admin123').")
            
        # Seed Standard User
        standard_user = db.query(User).filter(User.username == "user").first()
        if not standard_user:
            standard_user = User(
                username="user",
                password_hash=get_password_hash("user123"),
                role_id=user_role_id
            )
            db.add(standard_user)
            print("Added standard user ('user' / 'user123').")

        db.commit()
        print("Seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_data()
