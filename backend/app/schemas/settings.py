from pydantic import BaseModel, Field


class SiteSettingsOut(BaseModel):
    maintenance_notice_enabled: bool
    maintenance_notice_hours: int

    model_config = {"from_attributes": True}


class SiteSettingsUpdate(BaseModel):
    maintenance_notice_enabled: bool
    maintenance_notice_hours: int = Field(ge=1, le=240)
