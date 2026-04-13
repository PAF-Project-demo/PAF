package com.server.server;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.server.server.resource.service.ResourceService;

@SpringBootTest
class ResourceTest {

	@Autowired
	private ResourceService resourceService;

	@Test
	void testGetAll() {
		System.out.println("TEST_START");
		try {
			var list = resourceService.getAllResources(null, null, null);
			System.out.println("TEST_SUCCESS: " + list.size());
		} catch (Exception e) {
			System.out.println("TEST_FAILED: " + e.getMessage());
			e.printStackTrace();
		}
	}
}
