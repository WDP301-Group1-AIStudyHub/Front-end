package com.example.demo.mapper;

import com.example.demo.dto.request.BloodInventoryRequest;
import com.example.demo.dto.response.BloodInventoryResponse;
import com.example.demo.entity.BloodInventory;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface BloodInventoryMapper {
    BloodInventory toBloodInventory(BloodInventoryRequest request);

    @Mapping(source = "inventoryId", target = "inventoryId")
    BloodInventoryResponse toBloodInventoryResponse(BloodInventory bloodInventory);

    @Mapping(target = "unitsAvailable", expression = "java((int) request.getUnitsAvailable())")
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    BloodInventory updateBloodInventory(@MappingTarget BloodInventory entity, BloodInventoryRequest request);
}
