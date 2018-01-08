import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Entity } from './entity.model';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.css']
})
export class EntitiesComponent implements OnInit {

  constructor(private http: HttpClient) { }
  entities: Entity[];
  selectedEntity: Entity = null;
  httpURL: String = 'http://localhost:10010/ne/entity';
  totalEntity: number;
  page: number = 1;
  count: number = 6;
  showLoadMore: boolean = true;
  entitySearch: string = '';
  isLoading: any = { 'list': true , 'details': true };
  isModified: Boolean = false;
  previousEntity: Entity = null;
  showPopup: Boolean = false;
  isDupicateError: boolean = false;
  @ViewChild('entityForm') form;
  ngOnInit() {
    this.getEntites(`?sort=_id&page=${this.page}&count=${this.count}`);
    this.setTotalCount();
  }

  setTotalCount() {
    this.doRESTcall('GET', '', '/count').subscribe(val => this.totalEntity = val);
  }

  viewEntity(entity: Entity) {
    this.selectedEntity = entity;
    if (this.isModified) {
      this.showPopup = true;
    } else {
      this.previousEntity = this.selectedEntity;
    }
    if (this.form) {
      this.form.reset();
    }
    this.isDupicateError = false;
  }

  loadMore() {
    if (this.count < this.totalEntity) {
      this.isLoading.list = true;
      this.count += this.count;
      console.log('load more' + this.count);
      this.getEntites(`?sort=_id&page=${this.page}&count=${this.count}`);
    }
  }

  searchForEntity() {
    this.isLoading.list = true;
    if (this.entitySearch != '') {
      let filters = `filter={"_id":"/${this.entitySearch}/"}&sort=_id`;
      this.doRESTcall('GET', '', '?' + filters).subscribe(data => {
        this.entities = data;
        //this.isLoading.loadMore = false;
        this.showLoadMore = false;
        this.isLoading.list = false;
      });
    } else {
      this.showLoadMore = true;
      this.isLoading.list = true;
      this.getEntites(`?sort=_id&page=${this.page}&count=${this.count}`);
    }
  }
  clearSearch() {
    this.entitySearch = '';
    this.isLoading.list = true;
    this.getEntites(`?sort=_id&page=${this.page}&count=${this.count}`);
  }

  cancelChanges(event) {
    const entity: Entity = event.entity;
    this.doRESTcall('GET', '', '/' + entity._id).subscribe(data => {
      //this.selectedEntity = data;
      for (let i = 0; i < this.entities.length; i++) {
        if (this.entities[i]._id === entity._id) {
          this.entities[i] = data;
          event.isSelected ? this.selectedEntity = data : false;
          console.log(data);
          break;
        }
      }
    });
  }

  getEntites(param) {
    this.isLoading.details = true;
    this.doRESTcall('GET', '', param).subscribe(data => {
      this.isLoading.list = this.isLoading.details = false;
      this.entities = data;
      if (!this.selectedEntity) {
        this.viewEntity(this.entities[0]);
      }
      this.entities = data;
    },
      err => {
        console.log('HTTP Error' + err);
      });
  }

  putEntity(entity: Entity) {
    const body = { 'definition': entity.definition };
    this.doRESTcall('PUT', body, '/' + entity._id).subscribe(data => {
      console.log(data);
    });
  }

  doRESTcall(method, body, param): Observable<any> {
    return this.http.request(method, this.httpURL + param, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
      params: param
    });
  }

  // Definition view
  closePopup(isConfirmed) {
    isConfirmed ? this.putEntity(this.previousEntity) : this.cancelChanges({ entity: this.previousEntity, isSelected: false });
    this.showPopup = this.isModified = this.isDupicateError = this.isDupicateError = false;
    this.previousEntity = this.selectedEntity;
  }

  deleteDefn(value) {
    this.selectedEntity.definition.splice(this.selectedEntity.definition.indexOf(value), 1);
    this.isModified = true;
  }

  addDefn(value) {
    console.log(value);
    if (this.selectedEntity.definition.indexOf(value) === -1) {
      this.selectedEntity.definition.push(value);
      this.isModified = true;
      this.isDupicateError = false;
    } else {
      this.isDupicateError = true;
    }
    this.form.reset();
  }

  save() {
    this.putEntity(this.selectedEntity);
    this.isModified = false;
    this.form.reset();
  }

  cancel() {
    this.isModified = false;
    this.cancelChanges({ entity: this.selectedEntity, isSelected: true });
  }


}
