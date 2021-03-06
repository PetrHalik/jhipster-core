/**
 * Copyright 2013-2018 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see http://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-new, no-unused-expressions */
const expect = require('chai').expect;

const fail = expect.fail;
const fs = require('fs');
const path = require('path');
const JSONParser = require('../../../lib/parser/json_parser');
const UnaryOptions = require('../../../lib/core/jhipster/unary_options');
const BinaryOptions = require('../../../lib/core/jhipster/binary_options').Options;
const BinaryOptionValues = require('../../../lib/core/jhipster/binary_options').Values;

describe('JSONParser', () => {
  describe('::parseEntities', () => {
    let content = null;

    before(() => {
      const entities = {
        Employee: readJsonEntity('Employee'),
        Country: readJsonEntity('Country'),
        Department: readJsonEntity('Department'),
        JobHistory: readJsonEntity('JobHistory'),
        Location: readJsonEntity('Location'),
        Region: readJsonEntity('Region'),
        Job: readJsonEntity('Job'),
        Task: readJsonEntity('Task')
      };
      entities.Employee.relationships.filter(r => r.relationshipName === 'department')[0].javadoc = undefined;
      content = JSONParser.parseEntities(entities);
    });

    context('when parsing a JSON entity to JDL', () => {
      it('parses entity javadoc', () => {
        expect(content.entities.Employee.comment).eq('The Employee entity.');
      });
      it('parses tableName', () => {
        expect(content.entities.Employee.tableName).eq('emp');
      });
      it('parses mandatory fields', () => {
        expect(content.entities.Country.fields.countryId.type).eq('Long');
        expect(content.entities.Country.fields.countryName.type).eq('String');
      });
      it('parses field javadoc', () => {
        expect(content.entities.Country.fields.countryId.comment).eq('The country Id');
        expect(content.entities.Country.fields.countryName.comment).to.be.undefined;
      });
      it('parses validations', () => {
        expect(content.entities.Department.fields.departmentName.validations.required.name).eq('required');
        expect(content.entities.Department.fields.departmentName.validations.required.value).to.be.undefined;
        expect(content.entities.Employee.fields.salary.validations.min.value).eq(10000);
        expect(content.entities.Employee.fields.salary.validations.max.value).eq(1000000);
        expect(content.entities.Employee.fields.employeeId.validations).to.be.empty;
      });
      it('parses enums', () => {
        expect(content.enums.Language.name).eq('Language');
        expect(content.enums.Language.values.has('FRENCH')).to.be.true;
        expect(content.enums.Language.values.has('ENGLISH')).to.be.true;
        expect(content.enums.Language.values.has('SPANISH')).to.be.true;
      });
      it('parses options', () => {
        expect(
          content.getOptions().filter(
            option => option.name === BinaryOptions.DTO
              && option.value === BinaryOptionValues.dto.MAPSTRUCT
              && option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option => option.name === BinaryOptions.PAGINATION
              && option.value === BinaryOptionValues.pagination['INFINITE-SCROLL']
              && option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option => option.name === BinaryOptions.SERVICE
              && option.value === BinaryOptionValues.service.SERVICE_CLASS
              && option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option => option.name === BinaryOptions.SEARCH_ENGINE
              && option.value === BinaryOptionValues.searchEngine.ELASTIC_SEARCH
              && option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option => option.name === BinaryOptions.MICROSERVICE
              && option.value === 'mymicroservice'
              && option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option => option.name === BinaryOptions.ANGULAR_SUFFIX
              && option.value === 'myentities'
              && option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option =>
              option.name === UnaryOptions.NO_FLUENT_METHOD &&
              option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option =>
              option.name === UnaryOptions.FILTER &&
              option.entityNames.has('Employee')
          ).length
        ).to.eq(1);
      });
    });

    context('when parsing JSON entities to JDL', () => {
      it('parses unidirectional OneToOne relationships', () => {
        expect(content.relationships.relationships.OneToOne).has.property('OneToOne_Department{location}_Location');
      });
      it('parses bidirectional OneToOne relationships', () => {
        expect(content.relationships.relationships.OneToOne).has.property('OneToOne_Country{region}_Region{country}');
      });
      it('parses bidirectional OneToMany relationships', () => {
        expect(
          content.relationships.relationships.OneToMany
        ).has.property('OneToMany_Department{employee}_Employee{department(foo)}');
      });
      it('parses unidirectional ManyToOne relationships', () => {
        expect(content.relationships.relationships.ManyToOne).has.property('ManyToOne_Employee{manager}_Employee');
      });
      it('parses ManyToMany relationships', () => {
        expect(content.relationships.relationships.ManyToMany).has.property('ManyToMany_Job{task(title)}_Task{job}');
      });
      it('parses comments in relationships for owner', () => {
        expect(
          content.relationships.relationships.OneToMany['OneToMany_Department{employee}_Employee{department(foo)}'].commentInFrom
        ).to.eq('A relationship');
        expect(
          content.relationships.relationships.OneToMany['OneToMany_Department{employee}_Employee{department(foo)}'].commentInTo
        ).to.be.undefined;
      });
      it('parses comments in relationships for owned', () => {
        const entities = {
          Department: readJsonEntity('Department'),
          Employee: readJsonEntity('Employee')
        };
        entities.Department.relationships.filter(r => r.relationshipName === 'employee')[0].javadoc = undefined;
        const content = JSONParser.parseEntities(entities);
        expect(
          content.relationships.relationships.OneToMany['OneToMany_Department{employee}_Employee{department(foo)}'].commentInFrom
        ).to.be.undefined;
        expect(
          content.relationships.relationships.OneToMany['OneToMany_Department{employee}_Employee{department(foo)}'].commentInTo
        ).to.eq('Another side of the same relationship');
      });
      it('parses required relationships in owner', () => {
        expect(
          content.relationships.relationships.OneToMany['OneToMany_Department{employee}_Employee{department(foo)}'].isInjectedFieldInFromRequired
        ).to.be.true;
        expect(
          content.relationships.relationships.OneToMany['OneToMany_Department{employee}_Employee{department(foo)}'].isInjectedFieldInToRequired
        ).to.be.undefined;
      });
      it('parses required relationships in owned', () => {
        expect(
          content.relationships.relationships.ManyToMany['ManyToMany_Job{task(title)}_Task{job}'].isInjectedFieldInToRequired
        ).to.be.true;
        expect(
          content.relationships.relationships.ManyToMany['ManyToMany_Job{task(title)}_Task{job}'].isInjectedFieldInFromRequired
        ).to.be.undefined;
      });
    });

    context('when parsing app config file to JDL', () => {
      let content = null;

      before(() => {
        const yoRcJson = readJsonYoFile();
        content = JSONParser.parseServerOptions(yoRcJson['generator-jhipster']);
      });

      it('parses server options', () => {
        expect(content.getOptions().filter(
          option => option.name === UnaryOptions.SKIP_CLIENT && option.entityNames.has('*')).length
        ).to.eq(1);
        expect(
          content.getOptions().filter(
            option => option.name === UnaryOptions.SKIP_SERVER && option.entityNames.has('*')).length
        ).to.eq(1);
      });
    });

    context('when parsing entities with relationships to User', () => {
      context('when skipUserManagement flag is not set', () => {
        context('when there is no User.json entity', () => {
          let content = null;

          before(() => {
            const entities = {
              Country: readJsonEntity('Country')
            };
            content = JSONParser.parseEntities(entities);
          });

          it('parses relationships to the JHipster managed User entity', () => {
            expect(content.relationships.relationships.OneToOne).has.property('OneToOne_Country{user}_User');
          });
        });
        context('when there is a User.json entity', () => {
          it('throws an error ', () => {
            try {
              JSONParser.parseEntities({
                Country: readJsonEntity('Country'),
                User: readJsonEntity('Region')
              });
              fail();
            } catch (error) {
              expect(error.name).to.eq('IllegalNameException');
            }
          });
        });
      });
      context('when skipUserManagement flag is set', () => {
        let content = null;

        before(() => {
          const entities = {
            Country: readJsonEntity('Country'),
            User: readJsonEntity('Region')
          };
          entities.User.relationships[0].otherEntityRelationshipName = 'user';
          const yoRcJson = readJsonYoFile();
          yoRcJson['generator-jhipster'].skipUserManagement = true;
          content = JSONParser.parseEntities(entities, JSONParser.parseServerOptions(yoRcJson['generator-jhipster']));
        });

        it('parses the User.json entity if skipUserManagement flag is set', () => {
          expect(content.entities.Country).not.to.be.undefined;
          expect(content.entities.User).not.to.be.undefined;
          expect(content.entities.User.fields.regionId).not.to.be.undefined;
          expect(content.relationships.relationships.OneToOne).has.property('OneToOne_Country{user}_User{country}');
        });
      });
    });
  });
});

function readJsonEntity(entityName) {
  return JSON.parse(
    fs.readFileSync(
      path.join('test', 'test_files', 'jhipster_app', '.jhipster', `${entityName}.json`),
      'utf-8'
    ).toString()
  );
}

function readJsonYoFile() {
  return JSON.parse(fs.readFileSync('./test/test_files/jhipster_app/.yo-rc.json'));
}
