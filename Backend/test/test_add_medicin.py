import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock, patch
from routes.medicament_router import create_medicament
from Dto.medicamentdto import MedicamentCreate, MedicamentResponse

# We need to patch the Medicament model to avoid SQLAlchemy initialization issues
@pytest.fixture
def mock_medicament():
    with patch('routes.medicament_router.Medicament') as mock_class:
        # Create a mock instance that will be returned when Medicament is instantiated
        mock_instance = MagicMock()
        mock_class.return_value = mock_instance
        
        # Configure the mock to properly handle attribute access
        def configure_mock_instance(data):
            for key, value in data.items():
                setattr(mock_instance, key, value)
            return mock_instance
            
        mock_class.configure_mock = configure_mock_instance
        yield mock_class, mock_instance

@pytest.fixture
def mock_db_session():
    """Create a mock database session for testing."""
    mock_session = AsyncMock(spec=AsyncSession)
    mock_session.commit = AsyncMock()
    mock_session.refresh = AsyncMock()
    mock_session.add = MagicMock()
    return mock_session
@pytest.mark.asyncio
async def test_create_medicament_success(mock_db_session, mock_medicament):
    """Test successful creation of a medicament."""
    # Arrange
    mock_class, mock_instance = mock_medicament
    
    test_medicament_data = {
        "name": "Test Medication",
        "description": "This is a test medication",
        "price": 10.99,
        "dosage": "10mg",
        "duration": "7 days",
        "stock": 100,
        "image": "/static/uploads/medicaments/default.jpg"
    }
    medicament_create = MedicamentCreate(**test_medicament_data)
    # Configure the mock instance to have the expected attributes
    mock_class.configure_mock(test_medicament_data)
    # Act
    with patch('routes.medicament_router.Medicament', return_value=mock_instance):
        result = await create_medicament(medicament_create, mock_db_session)
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()  
    # Verify the result has the expected attributes
    assert result.name == test_medicament_data["name"]
    assert result.description == test_medicament_data["description"]
    assert result.price == test_medicament_data["price"]
    assert result.dosage == test_medicament_data["dosage"]
    assert result.duration == test_medicament_data["duration"]
    assert result.stock == test_medicament_data["stock"]
    assert result.image == test_medicament_data["image"]
