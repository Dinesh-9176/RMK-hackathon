import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import pickle
import os

# Set file paths
DATA_PATH = r'c:\Users\SAI RAM KRISHNA\OneDrive\Desktop\RMK\aegis_harvest_dataset.xlsx'
PRIMARY_MODEL_PATH = r'c:\Users\SAI RAM KRISHNA\OneDrive\Desktop\RMK\spoilage_model.pkl'
SECONDARY_MODEL_PATH = r'c:\Users\SAI RAM KRISHNA\OneDrive\Desktop\RMK\routing_model.pkl'

def engineer_features(df):
    """Applies recommended feature engineering to the dataset."""
    df = df.copy()
    
    # 1. Temperature Deviation (Target is 4°C)
    df['Temp_Deviation'] = df['Temp_C'] - 4
    
    # 2. Exponential Temperature Risk
    df['Exp_Temp_Risk'] = 2 ** ((df['Temp_C'] - 4) / 10)
    
    # 3. Vibration Flag
    df['Vibration_Flag'] = (df['Vibration_G'] > 0.5).astype(int)
    
    # 4. Stress Index
    df['Stress_Index'] = df['Exp_Temp_Risk'] * (1 + 0.5 * df['Vibration_Flag'])
    
    # Road Condition Multipliers for Classification logic
    road_mapping = {'Clear': 1.0, 'Traffic': 1.5, 'Construction': 1.8, 'Blocked': 5.0}
    df['Road_A_Mult'] = df['Road_A'].map(road_mapping).fillna(1.0)
    df['Road_B_Mult'] = df['Road_B'].map(road_mapping).fillna(1.0)
    
    return df

def train_models():
    print("🚀 Loading dataset...")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
        
    df = pd.read_excel(DATA_PATH)
    df = engineer_features(df)
    
    # ==========================================
    # 1️⃣ PRIMARY MODEL: Shelf-Life Predictor (Regression)
    # ==========================================
    print("\n--- Training Primary Model: Days_Left Predictor ---")
    
    reg_features = [
        'Temp_C', 'Humidity_Pct', 'Vibration_G', 'Distance_KM',
        'Temp_Deviation', 'Exp_Temp_Risk', 'Vibration_Flag', 'Stress_Index'
    ]
    X_reg = df[reg_features]
    y_reg = df['Days_Left']
    
    X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)
    
    model_reg = xgb.XGBRegressor(
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        n_jobs=-1,
        random_state=42
    )
    
    model_reg.fit(X_train_reg, y_train_reg)
    
    # Evaluation
    preds_reg = model_reg.predict(X_test_reg)
    mae = mean_absolute_error(y_test_reg, preds_reg)
    rmse = np.sqrt(mean_squared_error(y_test_reg, preds_reg))
    r2 = r2_score(y_test_reg, preds_reg)
    
    print(f"✅ Primary Model Trained.")
    print(f"📊 R² Score: {r2:.4f}")
    print(f"📊 MAE: {mae:.4f} days")
    print(f"📊 RMSE: {rmse:.4f} days")
    
    # Save the regression model
    with open(PRIMARY_MODEL_PATH, 'wb') as f:
        pickle.dump(model_reg, f)
    print(f"💾 Saved Primary Model to {PRIMARY_MODEL_PATH}")
    
    # ==========================================
    # 2️⃣ SECONDARY MODEL: Routing Classifier
    # ==========================================
    print("\n--- Training Secondary Model: Routing Classifier ---")
    
    # We use Predicted Days_Left as a feature to simulate the real-world flow
    # but for training we can use the true Days_Left OR the cross-validated predictions if we wanted.
    # To keep it robust, we'll use the model's own predictions on the whole set.
    df['Predicted_Days_Left'] = model_reg.predict(X_reg)
    
    # Encode Categorical Variables
    le_road = LabelEncoder()
    # Ensure all inputs are strings to avoid '<' error with NaNs or mixed types
    df['Road_A'] = df['Road_A'].astype(str)
    df['Road_B'] = df['Road_B'].astype(str)
    df['Best_Center'] = df['Best_Center'].astype(str)
    
    # Road_A and Road_B share the same labels technically
    all_roads = pd.concat([df['Road_A'], df['Road_B']]).unique()
    le_road.fit(all_roads)
    
    df['Road_A_Encoded'] = le_road.transform(df['Road_A'])
    df['Road_B_Encoded'] = le_road.transform(df['Road_B'])
    
    le_center = LabelEncoder()
    df['Best_Center_Encoded'] = le_center.fit_transform(df['Best_Center'])
    
    clf_features = [
        'Predicted_Days_Left', 'Dist_A_KM', 'Dist_B_KM', 
        'Road_A_Encoded', 'Road_B_Encoded', 'Cap_A_Pct', 'Cap_B_Pct', 
        'Distance_KM'
    ]
    
    X_clf = df[clf_features]
    y_clf = df['Best_Center_Encoded']
    
    X_train_clf, X_test_clf, y_train_clf, y_test_clf = train_test_split(X_clf, y_clf, test_size=0.2, random_state=42, stratify=y_clf)
    
    model_clf = xgb.XGBClassifier(
        n_estimators=500,
        learning_rate=0.1,
        max_depth=5,
        objective='multi:softprob',
        num_class=len(le_center.classes_),
        n_jobs=-1,
        random_state=42
    )
    
    model_clf.fit(X_train_clf, y_train_clf)
    
    # Evaluation
    preds_clf = model_clf.predict(X_test_clf)
    acc = accuracy_score(y_test_clf, preds_clf)
    
    print(f"✅ Secondary Model Trained.")
    print(f"📊 Accuracy: {acc:.4f}")
    print("\n📋 Classification Report:")
    print(classification_report(y_test_clf, preds_clf, target_names=le_center.classes_))
    
    # Save the classification model and encoders
    secondary_package = {
        'model': model_clf,
        'le_road': le_road,
        'le_center': le_center,
        'features': clf_features
    }
    
    with open(SECONDARY_MODEL_PATH, 'wb') as f:
        pickle.dump(secondary_package, f)
    print(f"💾 Saved Secondary Model package to {SECONDARY_MODEL_PATH}")
    
    # Final Confirmation
    if r2 > 0.85 and mae < 0.7:
        print("\n✨ SUCCESS: Model meets performance targets!")
    else:
        print("\n⚠️ WARNING: Model did not meet targets (R2 > 0.85, MAE < 0.7). Consider more tuning.")

class ColdChainPredictor:
    def __init__(self, primary_path=PRIMARY_MODEL_PATH, secondary_path=SECONDARY_MODEL_PATH):
        print("🔍 Loading Cold Chain Intelligence Models...")
        with open(primary_path, 'rb') as f:
            self.reg_model = pickle.load(f)
        
        with open(secondary_path, 'rb') as f:
            pkg = pickle.load(f)
            self.clf_model = pkg['model']
            self.le_road = pkg['le_road']
            self.le_center = pkg['le_center']
            self.clf_features = pkg['features']

    def calculate_survival_margins(self, df):
        """Calculates survival margins for Original, Center A, and Center B."""
        # Assume an average trunk speed of 60 km/h for the simulation
        AVG_SPEED_KMPH = 60
        
        # Original Destination
        # Note: Dataset doesn't have Road_Original, so we assume 'Clear' or map from existing features
        travel_time_orig = (df['Distance_KM'] / AVG_SPEED_KMPH) / 24 # Convert to days
        sm_original = df['Predicted_Days_Left'] - travel_time_orig
        
        # Center A
        travel_time_a = (df['Dist_A_KM'] / AVG_SPEED_KMPH * df['Road_A_Mult']) / 24
        sm_a = df['Predicted_Days_Left'] - travel_time_a
        
        # Center B
        travel_time_b = (df['Dist_B_KM'] / AVG_SPEED_KMPH * df['Road_B_Mult']) / 24
        sm_b = df['Predicted_Days_Left'] - travel_time_b
        
        return {
            'SM_Original': float(sm_original.iloc[0]),
            'SM_A': float(sm_a.iloc[0]),
            'SM_B': float(sm_b.iloc[0])
        }

    def predict(self, input_data):
        df = pd.DataFrame([input_data])
        df = engineer_features(df)
        
        # 1. Predict Shelf Life (Primary Model)
        reg_features = [
            'Temp_C', 'Humidity_Pct', 'Vibration_G', 'Distance_KM',
            'Temp_Deviation', 'Exp_Temp_Risk', 'Vibration_Flag', 'Stress_Index'
        ]
        pred_days = self.reg_model.predict(df[reg_features])[0]
        df['Predicted_Days_Left'] = pred_days
        
        # 2. Survival Margin Logic (Optimization Engine)
        margins = self.calculate_survival_margins(df)
        
        # 3. Predict Best Center (Secondary Model)
        df['Road_A_Encoded'] = self.le_road.transform(df['Road_A'].astype(str))
        df['Road_B_Encoded'] = self.le_road.transform(df['Road_B'].astype(str))
        
        clf_inputs = df[self.clf_features]
        center_encoded = self.clf_model.predict(clf_inputs)[0]
        best_center = self.le_center.inverse_transform([center_encoded])[0]
        
        # Market Pivot Trigger Recommendation
        pivot_suggested = best_center != "Original" and best_center != "Dump"
        
        return {
            'predicted_shelf_life': float(pred_days),
            'recommended_center': best_center,
            'survival_margins': margins,
            'stress_index': float(df['Stress_Index'].iloc[0]),
            'market_pivot_trigger': pivot_suggested
        }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--train":
        train_models()
    else:
        if not os.path.exists(PRIMARY_MODEL_PATH):
            train_models()
            
        predictor = ColdChainPredictor()
        
        # Scenario: High Stress - Danger of Spoilage
        test_scenario = {
            'Temp_C': 38.5,        # Very hot
            'Humidity_Pct': 90.0,
            'Vibration_G': 0.95,   # High mechanical stress
            'Distance_KM': 550,     # Far from original
            'Dist_A_KM': 80,       # Very close to A
            'Road_A': 'Clear',
            'Cap_A_Pct': 95,
            'Dist_B_KM': 300,
            'Road_B': 'Traffic',
            'Cap_B_Pct': 40
        }
        
        result = predictor.predict(test_scenario)
        print("\n" + "="*40)
        print("   COLD CHAIN INTELLIGENCE REPORT")
        print("="*40)
        print(f"Internal Temp  : {test_scenario['Temp_C']} C")
        print(f"Stress Index   : {result['stress_index']:.2f}")
        print(f"Est. Shelf Life: {result['predicted_shelf_life']:.2f} days")
        print("-" * 40)
        print("SURVIVAL MARGINS (SM = Days - Travel):")
        print(f" - Original    : {result['survival_margins']['SM_Original']:+.2f} days")
        print(f" - Center A    : {result['survival_margins']['SM_A']:+.2f} days")
        print(f" - Center B    : {result['survival_margins']['SM_B']:+.2f} days")
        print("-" * 40)
        print(f"DECISION       : {result['recommended_center']}")
        print(f"MARKET PIVOT   : {'REQUIRED' if result['market_pivot_trigger'] else 'NOT NEEDED'}")
        print("="*40)
